import { db, rtdb } from '../firebase';
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  getDoc 
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  push, 
  update, 
  remove, 
  serverTimestamp as rtdbTimestamp 
} from 'firebase/database';
import { 
  createODStatusNotification, 
  createODRequestUpdateNotifications 
} from './notificationService';

/**
 * Write data to both Firestore and Realtime Database
 * @param {Object} options - Configuration options
 * @param {string} options.firestoreCollection - Firestore collection name
 * @param {string} options.firestoreDocId - Optional document ID for Firestore (if not provided, auto-generated)
 * @param {string} options.rtdbPath - Path in Realtime Database
 * @param {Object} options.data - Data to write to both databases
 * @param {boolean} options.addTimestamp - Whether to add timestamp to the data (default: true)
 * @param {boolean} options.generateRtdbKey - Whether to generate a key for RTDB or use the provided path (default: true)
 * @returns {Promise<Object>} - Returns IDs/references for both database operations
 */
export const writeToAllDatabases = async ({
  firestoreCollection,
  firestoreDocId,
  rtdbPath,
  data,
  addTimestamp = true,
  generateRtdbKey = true
}) => {
  try {
    // Prepare data with timestamps if required
    const fsData = { 
      ...data,
      ...(addTimestamp && { timestamp: serverTimestamp() })
    };
    
    const rtdbData = { 
      ...data,
      ...(addTimestamp && { timestamp: rtdbTimestamp() })
    };

    // Firestore operation
    let firestoreRef;
    
    if (firestoreDocId) {
      // Use specified document ID
      const docRef = doc(db, firestoreCollection, firestoreDocId);
      await setDoc(docRef, fsData);
      firestoreRef = docRef;
    } else {
      // Auto-generate document ID
      firestoreRef = await addDoc(collection(db, firestoreCollection), fsData);
    }

    // Realtime Database operation
    let rtdbRef;
    
    if (generateRtdbKey) {
      // Generate a new key
      rtdbRef = push(ref(rtdb, rtdbPath));
      await set(rtdbRef, {
        ...rtdbData,
        firestoreId: firestoreRef.id // Link to Firestore ID for reference
      });
    } else {
      // Use specific path without generating key
      rtdbRef = ref(rtdb, rtdbPath);
      await set(rtdbRef, {
        ...rtdbData,
        firestoreId: firestoreRef.id // Link to Firestore ID for reference
      });
    }

    return {
      firestoreId: firestoreRef.id,
      firestorePath: `${firestoreCollection}/${firestoreRef.id}`,
      rtdbKey: rtdbRef.key,
      rtdbPath: rtdbRef.toString()
    };
  } catch (error) {
    console.error("Error writing to databases:", error);
    throw error;
  }
};

/**
 * Update data in both Firestore and Realtime Database
 * @param {Object} options - Configuration options
 * @param {string} options.firestoreCollection - Firestore collection name
 * @param {string} options.firestoreDocId - Document ID in Firestore
 * @param {string} options.rtdbPath - Full path in Realtime Database
 * @param {Object} options.data - Data to update in both databases
 * @param {boolean} options.addTimestamp - Whether to add updatedAt timestamp (default: true)
 * @returns {Promise<void>}
 */
export const updateInAllDatabases = async ({
  firestoreCollection,
  firestoreDocId,
  rtdbPath,
  data,
  addTimestamp = true
}) => {
  try {
    // Prepare update data
    const fsUpdateData = { 
      ...data,
      ...(addTimestamp && { updatedAt: serverTimestamp() })
    };
    
    const rtdbUpdateData = { 
      ...data,
      ...(addTimestamp && { updatedAt: rtdbTimestamp() })
    };

    // Update in Firestore
    const docRef = doc(db, firestoreCollection, firestoreDocId);
    await updateDoc(docRef, fsUpdateData);

    // Update in Realtime Database
    const dbRef = ref(rtdb, rtdbPath);
    await update(dbRef, rtdbUpdateData);

    return {
      success: true,
      firestorePath: `${firestoreCollection}/${firestoreDocId}`,
      rtdbPath
    };
  } catch (error) {
    console.error("Error updating in databases:", error);
    throw error;
  }
};

/**
 * Delete data from both Firestore and Realtime Database
 * @param {Object} options - Configuration options
 * @param {string} options.firestoreCollection - Firestore collection name
 * @param {string} options.firestoreDocId - Document ID in Firestore
 * @param {string} options.rtdbPath - Full path in Realtime Database
 * @returns {Promise<void>}
 */
export const deleteFromAllDatabases = async ({
  firestoreCollection,
  firestoreDocId,
  rtdbPath
}) => {
  try {
    // Delete from Firestore
    const docRef = doc(db, firestoreCollection, firestoreDocId);
    await deleteDoc(docRef);

    // Delete from Realtime Database
    const dbRef = ref(rtdb, rtdbPath);
    await remove(dbRef);

    return {
      success: true,
      message: "Data deleted from both Firestore and Realtime Database"
    };
  } catch (error) {
    console.error("Error deleting from databases:", error);
    throw error;
  }
};

/**
 * Example function for creating a new OD form request in both databases
 * @param {Object} formData - The OD form data
 * @returns {Promise<Object>} - Returns references to created data
 */
export const createODRequest = async (formData) => {
  try {
    console.log("Creating OD request with data:", formData);
    const userId = formData.userId;
    if (!userId) {
      throw new Error("userId is required for creating an OD request");
    }
    
    const timestamp = new Date().getTime();
    
    // Add workflow information to track the request progress
    const workflowData = {
      stage: 'event_leader_pending', // Initial workflow stage
      history: [{
        stage: 'submitted',
        timestamp: timestamp,
        by: userId,
        comments: 'Form submitted by student'
      }],
      notified: false, // Track if users have been notified
    };
    
    const requestData = {
      ...formData,
      status: 'pending',
      createdAt: timestamp,
      workflow: workflowData,
    };
    
    // Ensure we use the proper Firebase path format:
    // Firestore: 'odRequests' collection
    // RTDB: 'odRequests/{userId}'
    const dbResult = await writeToAllDatabases({
      firestoreCollection: 'odRequests',
      rtdbPath: `odRequests/${userId}`,
      generateRtdbKey: true,
      data: requestData
    });
    
    console.log("OD request created successfully:", dbResult);
    
    // Store the Firestore ID back in the RTDB record for easier reference
    try {
      // Update the RTDB record to include the firestoreId explicitly in its data
      const rtdbPath = dbResult.rtdbPath.split('.com/')[1];
      await updateInAllDatabases({
        firestoreCollection: 'odRequests',
        firestoreDocId: dbResult.firestoreId,
        rtdbPath: rtdbPath,
        data: {
          firestoreId: dbResult.firestoreId,
          updatedAt: timestamp
        },
        addTimestamp: false
      });
    } catch (updateError) {
      console.error("Error updating RTDB record with firestoreId:", updateError);
      // Continue even if this update fails
    }
    
    // Send notifications to event leaders about the new OD request
    try {
      const submittedRequestData = {
        ...requestData,
        id: dbResult.firestoreId
      };
      
      // Create notifications for all relevant parties
      await createODRequestUpdateNotifications(
        submittedRequestData,
        'submitted',
        'student'
      );
    } catch (error) {
      console.error('Error sending notifications for new OD request:', error);
      // Continue even if notifications fail
    }
    
    return dbResult;
  } catch (error) {
    console.error("Error in createODRequest:", error);
    throw error;
  }
};

/**
 * Update the status and workflow stage of an OD request
 * @param {string} requestId - Firestore document ID
 * @param {string} rtdbPath - Path to the data in Realtime Database
 * @param {string} status - New status (approved, rejected, etc.)
 * @param {string} workflowStage - New workflow stage
 * @param {Object} additionalData - Any additional data to update
 * @param {string} updatedBy - ID or name of the user making the update
 * @param {string} comments - Comments about the update
 * @returns {Promise<Object>} - Returns success status
 */
export const updateODRequestWorkflow = async (
  requestId, 
  rtdbPath, 
  status, 
  workflowStage, 
  additionalData = {},
  updatedBy = 'System',
  comments = ''
) => {
  try {
    // Get the current document to access the workflow history
    const docRef = doc(db, 'odRequests', requestId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('OD Request not found');
    }
    
    const requestData = docSnap.data();
    const currentWorkflow = requestData.workflow || { history: [] };
    
    // Extract the user ID from the path if it's not in the doc
    let userId = requestData.userId;
    if (!userId && rtdbPath) {
      // Attempt to extract from path format like "odRequests/USER_ID/REQUEST_ID"
      const pathParts = rtdbPath.split('/');
      if (pathParts.length >= 3 && pathParts[0] === 'odRequests') {
        userId = pathParts[1];
      }
    }
    
    // Make sure userId is included in the requestData
    if (userId && !requestData.userId) {
      requestData.userId = userId;
    }
    
    // Add new entry to workflow history
    const historyEntry = {
      stage: workflowStage,
      timestamp: new Date().getTime(),
      by: updatedBy,
      comments: comments,
      status: status
    };
    
    // Update the workflow object
    const updatedWorkflow = {
      ...currentWorkflow,
      stage: workflowStage,
      history: [...currentWorkflow.history, historyEntry],
      notified: false // Reset notification flag
    };
    
    // Update in both databases
    const updateResult = await updateInAllDatabases({
      firestoreCollection: 'odRequests',
      firestoreDocId: requestId,
      rtdbPath,
      data: {
        status,
        workflow: updatedWorkflow,
        ...additionalData,
        statusUpdatedAt: new Date().getTime(),
        userId: userId || requestData.userId // Ensure userId is included
      }
    });

    // Determine actor role based on the workflow stage
    let actorRole = 'system';
    if (workflowStage === 'faculty_pending' || workflowStage === 'rejected_by_event_leader') {
      actorRole = 'event_leader';
    } else if (workflowStage === 'completed' || workflowStage === 'rejected_by_faculty') {
      actorRole = 'faculty';
    }
    
    // Override actor role if specified in additionalData
    if (additionalData.role) {
      actorRole = additionalData.role;
      console.log(`Using explicitly provided role for notifications: ${actorRole}`);
    }
    
    // Send notifications with enhanced notification system
    try {
      const updatedRequestData = {
        ...requestData,
        id: requestId,
        status,
        workflow: updatedWorkflow,
        userId: userId || requestData.userId // Ensure userId is included for notifications
      };
      
      console.log(`Sending notification for OD request ${requestId}:`, {
        status: status,
        userId: updatedRequestData.userId || 'unknown',
        actorRole: actorRole,
        workflowStage: workflowStage
      });
      
      // Create notifications for all relevant parties
      const notifications = await createODRequestUpdateNotifications(
        updatedRequestData,
        status,
        actorRole,
        comments
      );
      
      console.log(`Successfully sent ${notifications?.length || 0} notifications`, notifications);
    } catch (error) {
      console.error('Error sending notifications for status update:', error);
      // Continue even if notifications fail
    }
    
    return updateResult;
  } catch (error) {
    console.error("Error updating OD request workflow:", error);
    throw error;
  }
};

/**
 * Example function for updating an OD request by Event Leader
 * @param {string} requestId - Firestore document ID
 * @param {string} rtdbPath - Path to the data in Realtime Database
 * @param {string} status - New status (approved, rejected)
 * @param {Object} additionalData - Any additional data to update
 * @returns {Promise<Object>} - Returns success status
 */
export const updateODRequestByEventLeader = async (requestId, rtdbPath, status, additionalData = {}) => {
  const workflowStage = status === 'approved' 
    ? 'faculty_pending'  // If approved, move to faculty review
    : 'rejected_by_event_leader'; // If rejected, mark as rejected by event leader
  
  return await updateODRequestWorkflow(
    requestId,
    rtdbPath,
    status,
    workflowStage,
    {
      ...additionalData,
      eventLeaderReviewedAt: new Date().getTime()
    },
    additionalData.updatedBy || 'Event Leader',
    additionalData.comments || ''
  );
};

/**
 * Example function for updating an OD request by Faculty
 * @param {string} requestId - Firestore document ID
 * @param {string} rtdbPath - Path to the data in Realtime Database
 * @param {string} status - New status (approved, rejected)
 * @param {Object} additionalData - Any additional data to update
 * @returns {Promise<Object>} - Returns success status
 */
export const updateODRequestByFaculty = async (requestId, rtdbPath, status, additionalData = {}) => {
  const workflowStage = status === 'approved' 
    ? 'completed' // If approved, mark as completed
    : 'rejected_by_faculty'; // If rejected, mark as rejected by faculty
  
  return await updateODRequestWorkflow(
    requestId,
    rtdbPath,
    status,
    workflowStage,
    {
      ...additionalData,
      facultyReviewedAt: new Date().getTime()
    },
    additionalData.updatedBy || 'Faculty',
    additionalData.comments || ''
  );
};

// The original updateODRequestStatus can still be used for backward compatibility
export const updateODRequestStatus = async (requestId, rtdbPath, status, comments = '', role = null) => {
  try {
    // First determine which dashboard is making the request based on the workflow stage
    if (!role) {
      // Try to get the current document to check its stage
      const docRef = doc(db, 'odRequests', requestId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // If the current stage is faculty_pending, it's likely a faculty member
        if (data.workflow?.stage === 'faculty_pending') {
          role = 'faculty';
        } else if (data.workflow?.stage === 'event_leader_pending') {
          role = 'event_leader';
        }
      }
    }
    
    console.log(`Updating request ${requestId} with status ${status} by role: ${role}`);
    
    if (role === 'faculty') {
      return await updateODRequestByFaculty(requestId, rtdbPath, status, {
        comments,
        role: 'faculty',
        updatedBy: 'Faculty'
      });
    } else {
      return await updateODRequestByEventLeader(requestId, rtdbPath, status, {
        comments,
        role: 'event_leader',
        updatedBy: 'Event Leader'
      });
    }
  } catch (error) {
    console.error('Error in updateODRequestStatus:', error);
    throw error;
  }
};

/**
 * Example function for tracking user activity in both databases
 * @param {string} userId - User ID
 * @param {string} action - Action performed (login, form_submit, etc.)
 * @param {Object} details - Additional details about the action
 * @returns {Promise<Object>} - Returns references to created data
 */
export const trackUserActivity = async (userId, action, details = {}) => {
  return await writeToAllDatabases({
    firestoreCollection: 'userActivities',
    rtdbPath: `userActivities/${userId}`,
    generateRtdbKey: true,
    data: {
      userId,
      action,
      details,
      ip: details.ip || 'unknown',
      device: details.device || 'unknown',
      browser: details.browser || 'unknown'
    }
  });
};