import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db, rtdb, storage } from '../firebase';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { ref as dbRef, onValue, get, child } from 'firebase/database';
import { 
  updateODRequestByEventLeader, 
  updateODRequestByFaculty 
} from '../services/firebaseDbUtils';

const useODRequests = (userRole = 'faculty') => {
  // Set the default activeFilter based on userRole
  const getDefaultFilter = (role) => {
    if (role === 'event_leader') return 'event_leader_pending';
    if (role === 'faculty') return 'faculty_pending';
    return 'pending';
  };

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState(getDefaultFilter(userRole));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Function to fetch download URL for documents
  const getDocumentURL = async (path) => {
    if (!path) return null;
    try {
      const docStorageRef = storageRef(storage, path);
      return await getDownloadURL(docStorageRef);
    } catch (error) {
      console.error("Error getting document URL:", error);
      return null;
    }
  };

  // Load requests from both Firestore and Realtime Database with real-time updates
  useEffect(() => {
    setIsLoading(true);
    setError(null); // Reset error state on role change
    
    try {
      // Set up Firestore query
      let firestoreQuery;
      
      if (userRole === 'event_leader') {
        // Event leaders see all requests but primarily work with event_leader_pending
        firestoreQuery = query(
          collection(db, 'odRequests'),
          orderBy('createdAt', 'desc')
        );
      } else if (userRole === 'faculty') {
        // Faculty can see all requests, but primarily work with faculty_pending stage
        firestoreQuery = query(
          collection(db, 'odRequests'),
          orderBy('createdAt', 'desc')
        );
      } else if (userRole === 'student' && window.currentUser?.uid) {
        // Students should only see their own requests - modified to be more inclusive
        console.log("Setting up student query for user:", window.currentUser.uid);
        
        // Important: For students, we don't want to filter in the query
        // because Firebase doesn't support OR conditions in queries
        // We'll fetch all requests and filter client-side for better results
        firestoreQuery = query(
          collection(db, 'odRequests'),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Default query for other roles
        firestoreQuery = query(
          collection(db, 'odRequests'),
          orderBy('createdAt', 'desc')
        );
      }
      
      // Set up Realtime Database reference for OD requests
      let rtdbReference;
      if (userRole === 'student' && window.currentUser?.uid) {
        // For students, only listen to their own requests
        rtdbReference = dbRef(rtdb, `odRequests/${window.currentUser.uid}`);
        console.log(`Setting up RTDB listener for student: ${window.currentUser.uid}`);
      } else {
        // For admins, faculty, and event leaders, listen to all requests
        rtdbReference = dbRef(rtdb, 'odRequests');
      }
      
      // Create an object to track all requests by their ID
      let allRequests = {};
      
      // Initialize counters
      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let eventLeaderPendingCount = 0;
      let facultyPendingCount = 0;
      
      // Set up Firestore listener
      const firestoreUnsubscribe = onSnapshot(firestoreQuery, async (querySnapshot) => {
        try {
          // Process Firestore documents
          const requestsPromises = querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const requestId = docSnapshot.id;
            
            // Determine the correct status based on workflow stage
            const workflowStage = data.workflow?.stage || 'unknown';
            
            // Update stats based on workflow stage for more accurate filters
            if (workflowStage === 'event_leader_pending') {
              eventLeaderPendingCount++;
              if (userRole === 'event_leader') pendingCount++;
            } else if (workflowStage === 'faculty_pending') {
              facultyPendingCount++;
              if (userRole === 'faculty') pendingCount++;
            } else if (workflowStage === 'completed') {
              approvedCount++;
            } else if (workflowStage === 'rejected_by_event_leader' || workflowStage === 'rejected_by_faculty') {
              rejectedCount++;
            }
            
            // Get document URL if exists
            let documentURL = null;
            if (data.documentPath) {
              documentURL = await getDocumentURL(data.documentPath);
            }
            
            // Create request object with source information
            const request = {
              id: requestId,
              source: 'firestore',
              ...data,
              documentURL,
              // Add computed properties for better filtering
              isPendingForCurrentRole: (userRole === 'event_leader' && workflowStage === 'event_leader_pending') ||
                                     (userRole === 'faculty' && workflowStage === 'faculty_pending')
            };
            
            // Add to tracking object
            allRequests[requestId] = request;
            
            return request;
          });
          
          const processedFirestoreRequests = await Promise.all(requestsPromises);
          
          // Check for legacy odForms collection for backward compatibility
          // Only needed for student role
          if ((userRole === 'student' || !userRole) && window.currentUser?.uid) {
            try {
              const userId = window.currentUser.uid;
              
              const legacyQuery = query(
                collection(db, 'odForms'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
              );
              
              const legacySnapshot = await getDocs(legacyQuery);
              
              if (!legacySnapshot.empty) {
                const legacyRequests = legacySnapshot.docs.map(doc => ({
                  id: doc.id,
                  source: 'legacy',
                  ...doc.data(),
                  // Add to tracking if not already present
                }));
                
                legacyRequests.forEach(request => {
                  if (!allRequests[request.id]) {
                    allRequests[request.id] = request;
                    
                    // Update stats
                    pendingCount += request.status === 'pending' ? 1 : 0;
                    approvedCount += request.status === 'approved' ? 1 : 0;
                    rejectedCount += request.status === 'rejected' ? 1 : 0;
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching legacy OD forms:', error);
            }
          }
          
          // Update stats
          setStats({
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            eventLeaderPending: eventLeaderPendingCount,
            facultyPending: facultyPendingCount,
            total: Object.keys(allRequests).length
          });
          
          // Update requests from combined sources
          setRequests(Object.values(allRequests));
          setIsLoading(false);
        } catch (err) {
          console.error("Error processing Firestore request data:", err);
          setError("Failed to process request data. Please try refreshing the page.");
          setIsLoading(false);
        }
      }, (err) => {
        console.error("Error fetching Firestore OD requests:", err);
        setError(err.message);
        setIsLoading(false);
      });
      
      // Set up Realtime Database listener
      const rtdbListener = onValue(rtdbReference, async (snapshot) => {
        try {
          if (snapshot.exists()) {
            // Get all student IDs
            const studentIds = Object.keys(snapshot.val());
            
            // Process each student's requests
            for (const studentId of studentIds) {
              const studentRequests = snapshot.val()[studentId];
              
              // Process each request
              for (const requestId in studentRequests) {
                const requestData = studentRequests[requestId];
                
                // Skip if already in allRequests with a newer timestamp
                if (allRequests[requestData.firestoreId] && 
                    allRequests[requestData.firestoreId].updatedAt > requestData.updatedAt) {
                  continue;
                }
                
                // Determine workflow stage
                const workflowStage = requestData.workflow?.stage || 'unknown';
                
                // Update counters if this is a new or updated request
                if (!allRequests[requestData.firestoreId]) {
                  if (workflowStage === 'event_leader_pending') {
                    eventLeaderPendingCount++;
                    if (userRole === 'event_leader') pendingCount++;
                  } else if (workflowStage === 'faculty_pending') {
                    facultyPendingCount++;
                    if (userRole === 'faculty') pendingCount++;
                  } else if (workflowStage === 'completed') {
                    approvedCount++;
                  } else if (workflowStage === 'rejected_by_event_leader' || workflowStage === 'rejected_by_faculty') {
                    rejectedCount++;
                  }
                }
                
                // Get document URL if exists
                let documentURL = null;
                if (requestData.documentPath) {
                  documentURL = await getDocumentURL(requestData.documentPath);
                }
                
                // Create request object with the RTDB path for future updates
                const request = {
                  id: requestData.firestoreId || requestId,
                  rtdbPath: `odRequests/${studentId}/${requestId}`,
                  source: 'rtdb',
                  ...requestData,
                  documentURL,
                  // Add computed properties for better filtering
                  isPendingForCurrentRole: (userRole === 'event_leader' && workflowStage === 'event_leader_pending') ||
                                         (userRole === 'faculty' && workflowStage === 'faculty_pending')
                };
                
                // Add to tracking object
                allRequests[request.id] = request;
              }
            }
            
            // Update stats
            setStats({
              pending: pendingCount,
              approved: approvedCount,
              rejected: rejectedCount,
              eventLeaderPending: eventLeaderPendingCount,
              facultyPending: facultyPendingCount,
              total: Object.keys(allRequests).length
            });
            
            // Update requests from combined sources
            setRequests(Object.values(allRequests));
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error("Error processing RTDB request data:", err);
          setError("Failed to process Realtime Database data. Please try refreshing the page.");
          setIsLoading(false);
        }
      }, (err) => {
        console.error("Error fetching RTDB OD requests:", err);
        setError(err.message);
        setIsLoading(false);
      });
      
      // Clean up listeners on unmount
      return () => {
        firestoreUnsubscribe();
        rtdbListener();
      };
    } catch (err) {
      console.error("Error setting up OD requests listeners:", err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [userRole]);

  // Filter requests based on active filter, search term, and user role
  useEffect(() => {
    try {
      if (!requests || requests.length === 0) {
        setFilteredRequests([]);
        return;
      }

      console.log(`Filtering ${requests.length} requests for role ${userRole} with filter ${activeFilter}`);
      
      // Create a copy of the requests array to avoid modifying the original
      let workingRequests = [...requests];
      
      // For student role, make sure we can see their own requests
      if (userRole === 'student' && window.currentUser?.uid) {
        console.log(`Student filtering for user ${window.currentUser.uid}`, 
          {requestCount: workingRequests.length}
        );
        
        // Filter the requests to only include those belonging to the current user
        // This is important to check both fields for backwards compatibility
        let studentRequests = workingRequests.filter(req => {
          const isCurrentUserRequest = 
            req.userId === window.currentUser.uid || 
            req.studentId === window.currentUser.uid;
          
          if (isCurrentUserRequest) {
            console.log(`Found request matching student ID: ${req.id}`, {
              eventName: req.eventName,
              stage: req.workflow?.stage || 'no_stage',
              status: req.status || 'no_status'
            });
          }
          
          return isCurrentUserRequest;
        });
        
        console.log(`After student filtering: ${studentRequests.length} requests match user ID`);
        
        // Use the student-filtered requests for further filtering
        workingRequests = studentRequests;
      }

      let result = [...workingRequests];
      
      // Apply status filter based on user role
      if (activeFilter === 'pending') {
        if (userRole === 'event_leader') {
          result = result.filter(request => request.workflow?.stage === 'event_leader_pending');
        } else if (userRole === 'faculty') {
          result = result.filter(request => request.workflow?.stage === 'faculty_pending');
        } else {
          // For students or other roles - include all "not completed" requests
          result = result.filter(request => 
            request.status === 'pending' || 
            request.workflow?.stage === 'event_leader_pending' || 
            request.workflow?.stage === 'faculty_pending'
          );
        }
      } else if (activeFilter === 'approved') {
        result = result.filter(request => 
          request.workflow?.stage === 'completed' || 
          request.status === 'approved'
        );
        console.log(`Found ${result.length} approved requests`);
      } else if (activeFilter === 'rejected') {
        result = result.filter(request => 
          request.workflow?.stage === 'rejected_by_event_leader' || 
          request.workflow?.stage === 'rejected_by_faculty' ||
          request.status === 'rejected'
        );
      } else if (activeFilter === 'faculty_pending') {
        result = result.filter(request => request.workflow?.stage === 'faculty_pending');
      } else if (activeFilter === 'event_leader_pending') {
        result = result.filter(request => request.workflow?.stage === 'event_leader_pending');
      } else if (activeFilter === 'all' || !activeFilter) {
        // No additional filtering if the filter is 'all' or not set
        console.log(`Showing all ${result.length} requests`);
      }
      
      // Apply search term
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        result = result.filter(request => 
          (request.userName && request.userName.toLowerCase().includes(term)) ||
          (request.eventName && request.eventName.toLowerCase().includes(term)) ||
          (request.studentId && request.studentId.toLowerCase().includes(term))
        );
      }
      
      console.log(`Filtered to ${result.length} requests`);
      
      setFilteredRequests(result);
    } catch (err) {
      console.error("Error filtering requests:", err);
      setError("Failed to filter requests. Please try refreshing the page.");
    }
  }, [requests, activeFilter, searchTerm, userRole]);

  // Update request status based on user role and source database
  const updateRequestStatus = async (requestId, rtdbPath, status, comments, role = null) => {
    try {
      if (!requestId) {
        throw new Error("Request ID is required to update status");
      }
      
      console.log(`Updating request status: ${requestId}, status: ${status}, role: ${role || userRole}`);
      
      const additionalData = {
        comments,
        updatedBy: role === 'faculty' ? 'Faculty' : 'Event Leader',
        role: role || userRole // Use explicitly passed role or default to userRole
      };
      
      // Use the appropriate update function based on provided role or user role
      if (role === 'faculty' || userRole === 'faculty') {
        await updateODRequestByFaculty(requestId, rtdbPath, status, additionalData);
      } else {
        await updateODRequestByEventLeader(requestId, rtdbPath, status, additionalData);
      }
      
      // Success will be reflected through the real-time listeners
      return { success: true };
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  };

  return {
    requests: filteredRequests,
    allRequests: requests,
    isLoading,
    error,
    stats,
    activeFilter,
    searchTerm,
    setActiveFilter,
    setSearchTerm,
    updateRequestStatus,
    userRole
  };
};

export default useODRequests;