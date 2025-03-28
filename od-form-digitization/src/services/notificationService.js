import { db, rtdb } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import {
  ref,
  push,
  set,
  update,
  onValue,
  serverTimestamp as rtdbTimestamp
} from 'firebase/database';

/**
 * Create a new notification
 * @param {Object} notification - Notification data
 * @returns {Promise<string>} - ID of the created notification
 */
export const createNotification = async (notification) => {
  try {
    // Required fields
    if (!notification.userId || !notification.message || !notification.type) {
      throw new Error('Required fields missing for notification');
    }

    // Add timestamps and set read status to false by default
    const notificationData = {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    
    // Add to Realtime Database for instant updates
    const rtdbRef = push(ref(rtdb, `notifications/${notification.userId}`));
    await set(rtdbRef, {
      ...notificationData,
      id: docRef.id, // include Firestore document ID
      createdAt: rtdbTimestamp(),
      updatedAt: rtdbTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get real-time notifications for a user
 * @param {string} userId - User ID
 * @param {function} callback - Callback function to handle notifications
 * @returns {function} - Unsubscribe function
 */
export const getNotificationsRealtime = (userId, callback) => {
  try {
    // Query for the user's notifications, ordered by creation time (newest first)
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Set up listener
    return onSnapshot(q, (snapshot) => {
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to JS Date
          createdAt: doc.data().createdAt ? 
            doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt ?
            doc.data().updatedAt.toDate() : new Date()
        });
      });
      callback(notifications);
    }, (error) => {
      console.error('Error getting notifications:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up notifications listener:', error);
    callback([]);
    return () => {}; // return empty unsubscribe function
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return; // No unread notifications
    }
    
    const batch = writeBatch(db);
    
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Create a notification for OD request status change
 * @param {Object} data - Data for the notification
 * @returns {Promise<string>} - ID of the created notification 
 */
export const createODStatusNotification = async ({
  userId,
  requestId,
  requestData,
  status,
  stage,
  message,
  actor,
  comments
}) => {
  try {
    return await createNotification({
      userId,
      type: 'od_request_status',
      message: message || `Your OD request ${getStatusMessage(status, stage)}`,
      requestId,
      requestData: {
        eventName: requestData.eventName,
        fromDate: requestData.fromDate,
        toDate: requestData.toDate || requestData.fromDate,
        status,
        stage
      },
      status,
      stage,
      actor,
      comments,
      link: `/student/my-od-requests?id=${requestId}`
    });
  } catch (error) {
    console.error('Error creating OD status notification:', error);
    throw error;
  }
};

/**
 * Get status message for OD request status change
 * @private
 */
const getStatusMessage = (status, stage) => {
  if (status === 'approved') {
    if (stage === 'faculty_pending') {
      return 'has been approved by the Event Leader and sent to Faculty for final review.';
    } else if (stage === 'completed') {
      return 'has been APPROVED! Your OD is confirmed.';
    }
    return 'has been approved.';
  } else if (status === 'rejected') {
    if (stage === 'rejected_by_event_leader') {
      return 'has been rejected by the Event Leader.';
    } else if (stage === 'rejected_by_faculty') {
      return 'has been rejected by the Faculty.';
    }
    return 'has been rejected.';
  }
  return 'has been updated.';
};

/**
 * Get unread notifications count for a user
 * @param {string} userId - User ID
 * @param {function} callback - Callback function to handle count
 * @returns {function} - Unsubscribe function
 */
export const getUnreadNotificationsCount = (userId, callback) => {
  try {
    // Monitor realtime database for faster updates
    const countRef = ref(rtdb, `notificationCounts/${userId}/unread`);
    
    return onValue(countRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : 0);
    }, (error) => {
      console.error('Error getting unread notifications count:', error);
      callback(0);
    });
  } catch (error) {
    console.error('Error setting up notifications count listener:', error);
    callback(0);
    return () => {}; // return empty unsubscribe function
  }
};

/**
 * Update unread notifications count for a user
 * @param {string} userId - User ID 
 * @param {number} count - Count to set (if null, will be calculated)
 * @returns {Promise<void>}
 */
export const updateUnreadNotificationsCount = async (userId, count = null) => {
  try {
    // If count not provided, calculate from Firestore
    if (count === null) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      count = querySnapshot.size;
    }
    
    // Update count in RTDB for faster access
    const countRef = ref(rtdb, `notificationCounts/${userId}/unread`);
    await set(countRef, count);
    
    return count;
  } catch (error) {
    console.error('Error updating unread notifications count:', error);
    throw error;
  }
};

/**
 * Create a notification for new OD request submission
 * @param {Object} data - OD request data
 * @param {string} targetUserRole - Role of user to notify ('event_leader' or 'faculty')
 * @returns {Promise<Array>} - Array of notification IDs created
 */
export const createNewRequestNotification = async (requestData, targetUserRole) => {
  try {
    // We need to query for all users with the specified role
    const roleQuery = query(
      collection(db, 'users'),
      where('role', '==', targetUserRole)
    );
    
    const usersSnapshot = await getDocs(roleQuery);
    const notificationIds = [];
    
    // Create a notification for each user with the target role
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userName = userDoc.data().displayName || 'User';
      
      // Create notification with appropriate message
      const notificationId = await createNotification({
        userId,
        type: 'new_od_request',
        message: targetUserRole === 'event_leader' 
          ? `New OD request from ${requestData.studentName || 'a student'} for ${requestData.eventName || 'event'} needs your review.`
          : `A new OD request is pending faculty approval for ${requestData.eventName || 'an event'}.`,
        requestId: requestData.id,
        requestData: {
          studentName: requestData.studentName,
          studentId: requestData.studentId,
          eventName: requestData.eventName,
          startDate: requestData.startDate,
          endDate: requestData.endDate || requestData.startDate
        },
        link: `/${targetUserRole.replace('_', '-')}-dashboard`
      });
      
      notificationIds.push(notificationId);
    }
    
    return notificationIds;
  } catch (error) {
    console.error('Error creating new request notifications:', error);
    throw error;
  }
};

/**
 * Create notifications for all relevant parties when an OD request is updated
 * @param {Object} requestData - The OD request data
 * @param {string} action - The action taken ('submitted', 'approved', 'rejected') 
 * @param {string} actorRole - Role of the actor ('student', 'event_leader', 'faculty')
 * @param {string} comments - Optional comments
 * @returns {Promise<Array>} - Array of notification IDs created
 */
export const createODRequestUpdateNotifications = async (
  requestData, 
  action, 
  actorRole, 
  comments = ''
) => {
  try {
    const notifications = [];
    const stage = requestData.workflow?.stage;
    
    console.log(`Creating notifications for request: ${requestData.id}`, {
      userId: requestData.userId,
      action,
      actorRole,
      stage,
      requestData: {
        eventName: requestData.eventName,
        workflow: requestData.workflow
      }
    });
    
    // Notification for student (request owner)
    if (requestData.userId && actorRole !== 'student') {
      // Debug info - log full userId to verify it's correct
      console.log(`Student notification for userId: ${requestData.userId}`, {
        studentName: requestData.studentName || requestData.userName,
        requestId: requestData.id,
        action: action,
        stage: stage
      });
      
      // Extra debug info for status updates
      if (action === 'approved' || action === 'rejected') {
        console.log(`PRIORITY NOTIFICATION: Creating ${action} notification for student ${requestData.userId}`, {
          stage: stage,
          actor: actorRole
        });
      }
      
      try {
        // Create a custom message based on stage and action
        let customMessage = '';
        if (actorRole === 'faculty' && action === 'approved') {
          customMessage = `Great news! Your OD request for ${requestData.eventName || 'your event'} has been APPROVED by faculty.`;
          console.log(`Creating FACULTY APPROVAL notification for student ${requestData.userId}`);
        } else if (actorRole === 'faculty' && action === 'rejected') {
          customMessage = `Your OD request for ${requestData.eventName || 'your event'} has been REJECTED by faculty.`;
          console.log(`Creating FACULTY REJECTION notification for student ${requestData.userId}`);
        } else if (actorRole === 'event_leader' && action === 'approved') {
          customMessage = `Your OD request for ${requestData.eventName || 'your event'} has been approved by the event leader and forwarded to faculty for final review.`;
        } else if (actorRole === 'event_leader' && action === 'rejected') {
          customMessage = `Your OD request for ${requestData.eventName || 'your event'} has been rejected by the event leader.`;
        }
        
        // Directly create the notification without using createODStatusNotification
        // to ensure all fields are properly set
        const notificationData = {
          userId: requestData.userId,
          type: 'od_request_status',
          message: customMessage || `Your OD request ${getStatusMessage(action, stage)}`,
          requestId: requestData.id,
          requestData: {
            eventName: requestData.eventName,
            fromDate: requestData.startDate,
            toDate: requestData.endDate || requestData.startDate,
            status: action,
            stage: stage
          },
          status: action,
          stage: stage,
          actor: actorRole,
          comments: comments,
          link: `/student-dashboard/requests?id=${requestData.id}`,
          isRead: false
        };
        
        console.log(`Creating notification with data:`, {
          userId: notificationData.userId,
          type: notificationData.type,
          status: notificationData.status,
          stage: notificationData.stage,
          actor: notificationData.actor
        });
        
        // Create the notification
        const studentNotificationId = await createNotification(notificationData);
        
        console.log(`Successfully created notification ${studentNotificationId} for student ${requestData.userId}`);
        notifications.push({ role: 'student', id: studentNotificationId });
        
        // Update unread count for the student
        await updateUnreadNotificationsCount(requestData.userId);
        
        // Also update in Realtime Database for faster updates
        try {
          const userNotificationsRef = ref(rtdb, `notificationCounts/${requestData.userId}/latestUpdate`);
          await set(userNotificationsRef, {
            action,
            timestamp: rtdbTimestamp(),
            requestId: requestData.id
          });
        } catch (rtdbError) {
          console.error(`Error updating realtime notification flag for student ${requestData.userId}:`, rtdbError);
        }
      } catch (studentNotifError) {
        console.error(`Error sending notification to student ${requestData.userId}:`, studentNotifError);
        console.error('Full request data causing error:', JSON.stringify({
          id: requestData.id,
          userId: requestData.userId,
          action,
          stage,
          actorRole
        }));
      }
    }
    
    // For new submissions, notify event leaders
    if (action === 'submitted') {
      try {
        const eventLeaderNotifications = await createNewRequestNotification(
          requestData, 
          'event_leader'
        );
        notifications.push(...eventLeaderNotifications.map(id => ({ role: 'event_leader', id })));
      } catch (error) {
        console.error('Error notifying event leaders:', error);
      }
    }
    
    // When event leader approves, notify faculty
    if (action === 'approved' && actorRole === 'event_leader') {
      try {
        const facultyNotifications = await createNewRequestNotification(
          requestData, 
          'faculty'
        );
        notifications.push(...facultyNotifications.map(id => ({ role: 'faculty', id })));
      } catch (error) {
        console.error('Error notifying faculty:', error);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating OD request update notifications:', error);
    throw error;
  }
};