import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiShoppingBag, FiPlusCircle, FiClock, FiCreditCard, FiSettings, FiSearch, FiMoon, FiSun } from 'react-icons/fi';
import { BsArrowRightShort, BsCheckCircleFill } from 'react-icons/bs';
import "../../index.css";
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const MAX_IMAGE_UPLOADS = 20;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_LIMIT_MESSAGE = 'You can upload up to 20 images (5MB max each).';

export const Admin = () => {
  const toast = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [categorySuccess, setCategorySuccess] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [verificationStats, setVerificationStats] = useState(null);
  const [showRejectSection, setShowRejectSection] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');


  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    height: '',
    length: '',
    width: '',
    weight: '',
    bidThreshold: '', 
    bidDeadline: '', 
    images: [],
  });

  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard 
  const navigate = useNavigate();
  const handleSearch = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        q: searchTerm,
        role: roleFilter,
        page: page,
        limit: limit
      }).toString();

      const response = await fetch(`http://localhost:5000/api/search/search/users?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data.users);
        setTotalCount(data.data.pagination.totalItems);
      } else {
        setError(data.message || 'Хайлт амжилтгүй боллоо');
      }
    } catch (err) {
      setError('Серверийн алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending verifications
  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await axios.get('http://localhost:5000/api/identity-verification/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Pending verifications response:', response.data);
      console.log('Users with verification:', response.data.users);
      setPendingVerifications(response.data.users);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      setError('Баталгаажуулалт татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // Fetch verification stats
  const fetchVerificationStats = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await axios.get('http://localhost:5000/api/identity-verification/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerificationStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle approve verification
  const handleApproveVerification = async (userId, notes = '') => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await axios.post(
        `http://localhost:5000/api/identity-verification/approve/${userId}`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Баталгаажуулалт амжилттай зөвшөөрөгдлөө');
      setShowUserDetailModal(false);
      fetchPendingVerifications();
      fetchVerificationStats();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(error.response?.data?.error || 'Баталгаажуулахад алдаа гарлаа');
    }
  };

  // Handle reject verification
  const handleRejectVerification = async (userId, reason) => {
    if (!reason || reason.trim().length === 0) {
      toast.error('Татгалзсан шалтгаан оруулна уу');
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await axios.post(
        `http://localhost:5000/api/identity-verification/reject/${userId}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Баталгаажуулалт татгалзагдлаа');
      setShowUserDetailModal(false);
      fetchPendingVerifications();
      fetchVerificationStats();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(error.response?.data?.error || 'Татгалзахад алдаа гарлаа');
    }
  };

  // Handle user click
  const handleUserClick = (user) => {
    setSelectedUserForDetail(user);
    setShowUserDetailModal(true);
    setShowRejectSection(false);
    setRejectionReason('');
  };
  
  useEffect(() => {
    const getMyProducts = async () => {
      try {
        const userData = localStorage.getItem('user');
        
        if (!userData) {
          throw new Error('No user data found - please login');
        }
  
        const parsedUser = JSON.parse(userData);
        const token = parsedUser.token;
        
        if (!token) {
          throw new Error('No token found in user data');
        }
  
        setUser(parsedUser);
  
        const url = debouncedSearchTerm
          ? `http://localhost:5000/api/product/my?search=${debouncedSearchTerm}`
          : 'http://localhost:5000/api/product/my';
  
        const productsResponse = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true 
        });
        
        setProducts(productsResponse.data);
        
      } catch (err) {
        console.log('Error:', err);
        setError(err.message || 'Couldn\'t load products. Please try refreshing.');
        if (err.message.includes('token') || err.message.includes('login')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
  
    getMyProducts();
  }, [debouncedSearchTerm, navigate]); 
  

    const handleSellProduct = async (productId, currentBid) => {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      if (!token) {
        navigate('/login');
        return;
      }
    
      try {
        const confirmSale = window.confirm(`Та энэ барааг ${currentBid}₮-р зарахад итгэлтэй байна уу?`);
        if (!confirmSale) return;
    
        const response = await axios.post(
          'http://localhost:5000/api/bidding/sell',
          { productId, price: currentBid },
          { headers: { Authorization: `Bearer ${token}` } }
        );
    
        if (response.data.sold) {
          toast.success(`Бараа амжилттай зарагдлаа! Гүйлгээний дугаар: ${response.data.transactionId}`);
          const productsResponse = await axios.get('http://localhost:5000/api/product/my', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProducts(productsResponse.data);
        }
      } catch (error) {
        console.error('Sell product error:', error);
        toast.error(error.response?.data?.message || 'Бараа зарах явцад алдаа гарлаа');
      }
    };
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await axios.get('http://localhost:5000/api/category/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      setError('Failed to fetch categories');
    }
  };fetchCategories();});
  const handleApproveRequest = async (requestId, userId, amount) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      
      await axios.post(
        `http://localhost:5000/api/users/addBalance`,
        { userId, amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await handleDeleteRequest(requestId);

      toast.success('Хүсэлт амжилттай зөвшөөрөгдлөө');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Хүсэлт зөвшөөрөхөд алдаа гарлаа');
    }
  };
  
  const handleDeleteRequest = async (requestId) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await axios.delete(
        `http://localhost:5000/api/request/${requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Хүсэлт устгахад алдаа гарлаа');
      return false;
    }
  };
  const fetchUserProducts = async (userId) => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const response = await axios.get(`http://localhost:5000/api/product/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserProducts(response.data);
      setSelectedUser(userId);
      setActiveTab('userProducts');
    } catch (error) {
      console.error('Error fetching user products:', error);
      setError('Failed to fetch user products');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const getUsers = async () => {
      try {
        const userData = localStorage.getItem('user');
        
        if (!userData) {
        }
  
        const parsedUser = JSON.parse(userData);
        const token = parsedUser.token;
        
     
        setUser(parsedUser);
  
        const usersResponse = await axios.get('http://localhost:5000/api/users/allusers', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true 
        });
        
        setUsers(usersResponse.data);
        
      } catch (err) {
        if (err.message.includes('token') || err.message.includes('login')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
  
    getUsers();
  }, []); 
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const response = await axios.get('http://localhost:5000/api/request/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to fetch requests');
      }
    };

    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchPendingVerifications();
      fetchVerificationStats();
    }
  }, [activeTab]);


const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (name === 'images') {
    if (!files || files.length === 0) {
      return;
    }

    const attachedFiles = Array.from(files);
    const validFiles = attachedFiles.filter(file =>
      file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE_BYTES
    );

    if (validFiles.length !== attachedFiles.length) {
      toast.warning('?????? ????? ???? (JPG, PNG) ??????? ??. ?????? ?????? 5MB-??? ????? ???? ?????.');
    }

    if (validFiles.length === 0) {
      return;
    }

    let limitReached = false;
    let selectionTrimmed = false;

    setFormData(prev => {
      const remainingSlots = MAX_IMAGE_UPLOADS - prev.images.length;
      if (remainingSlots <= 0) {
        limitReached = true;
        return prev;
      }

      const filesToAdd = validFiles.slice(0, remainingSlots);
      if (filesToAdd.length < validFiles.length) {
        selectionTrimmed = true;
      }

      if (filesToAdd.length === 0) {
        limitReached = true;
        return prev;
      }

      const imagePreviews = filesToAdd.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      return {
        ...prev,
        images: [...prev.images, ...imagePreviews]
      };
    });

    if (limitReached) {
      toast.warning(IMAGE_LIMIT_MESSAGE);
    } else if (selectionTrimmed) {
      toast.info(IMAGE_LIMIT_MESSAGE);
    }
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

// Handle parent category change
const handleParentCategoryChange = (e) => {
  const parentId = e.target.value;
  setParentCategory(parentId);

  // Clear subcategory selection
  setFormData(prev => ({ ...prev, category: "" }));

  // Find subcategories for this parent
  if (parentId) {
    const subs = categories.filter(cat => {
      if (!cat.parent) return false;
      const parentCategoryId = typeof cat.parent === "object" && cat.parent !== null
        ? cat.parent._id?.toString()
        : cat.parent?.toString();
      return parentCategoryId === parentId;
    });
    setSubcategories(subs);
  } else {
    setSubcategories([]);
  }
};

const removeImage = (index) => {
  setFormData(prev => {
    const newImages = [...prev.images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    return { ...prev, images: newImages };
  });
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setUploading(true);
  
  if (!formData.title || !formData.description || !formData.price || !formData.bidDeadline) {
    toast.error('Бүх шаардлагатай талбарыг бөглөнө үү');
    setUploading(false);
    return;
  }

  if (formData.images.length === 0) {
    toast.error('Хамгийн багадаа 1 зураг оруулна уу');
    setUploading(false);
    return;
  }

  if (new Date(formData.bidDeadline) <= new Date()) {
    toast.error('Дуудлагын дуусах хугацаа ирээдүйд байх ёстой');
    setUploading(false);
    return;
  }

  try {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key !== 'images' && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    formData.images.forEach((imageObj, index) => {
      formDataToSend.append(`images`, imageObj.file); 
    });
    
    const response = await axios.post(
      'http://localhost:5000/api/product/', 
      formDataToSend,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success('Бараа амжилттай нэмэгдлээ!');
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      height: '',
      length: '',
      width: '',
      weight: '',
      bidThreshold: '',
      bidDeadline: '',
      images: [],
    });
    console.log(formData)

  } catch (error) {
    console.error('Error submitting:', error);
    toast.error(error.response?.data?.message || 'Алдаа гарлаа. Дахин оролдоно уу?');
  } finally {
    setUploading(false);
  }
};
  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <h2>You need to log in first</h2>
        <p className="mb-3">Please sign in to view your profile</p>
        <a href="/login" className="btn btn-primary">Login</a>
      </div>
    );
  }
  const handleAddBalanceClick = (userId) => {
    setSelectedUserId(userId);
    setShowAddBalanceModal(true);
  };

  const handleBalanceSubmit = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      
      await axios.post(
        `http://localhost:5000/api/users/addBalance`,
        { userId: selectedUserId, amount: parseFloat(balanceAmount) },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const usersResponse = await axios.get('http://localhost:5000/api/users/allusers', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      });
      
      setUsers(usersResponse.data);
      toast.success('Balance added successfully!');
      setShowAddBalanceModal(false);
      setBalanceAmount(0);
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error('Failed to add balance');
    } finally {
      setLoading(false);
    }
  };


  return (
     <div className="container-fluid px-0">
         <div className="profile-header bg-gradient-primary text-white py-4">
   
           <div className="container">
             <div className="d-flex align-items-center">
               <div className="profile-avatar me-4">
                 <div className="avatar-circle bg-white text-primary">
                   {user.name.charAt(0).toUpperCase()}
                 </div>
               </div>
               <div>
                 <h2 className="mb-1">{user.name}</h2>
                 <p className="mb-2">{user.email}</p>
                 <div className="d-flex align-items-center">
                   <span className="badge bg-white text-primary fs-6 px-3 py-2 me-3">
                     {user.balance?.toFixed(2) || '0.00'}₮
                   </span>
                 
                 </div>
               </div>
             </div>
           </div>
         </div>
{showAddBalanceModal && (
  <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Данс цэнэглэх</h5>
          <button 
            type="button" 
            className="btn-close"
            onClick={() => setShowAddBalanceModal(false)}
          ></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="mb-3">
            <label className="form-label">Дүн (₮)</label>
            <input
              type="number"
              className="form-control"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              min="1000"
              step="1000"
              required
            />
            <div className="form-text">Хамгийн бага дүн: 1,000₮</div>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowAddBalanceModal(false)}
            disabled={loading}
          >
            Цуцлах
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleBalanceSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Хадгалж байна...
              </>
            ) : (
              'Хадгалах'
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* User Detail Modal for Verification Review */}
{showUserDetailModal && selectedUserForDetail && (
  <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-xl">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            <BsCheckCircleFill className="me-2" />
            Баталгаажуулалт шалгах - {selectedUserForDetail.name}
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowUserDetailModal(false)}
          ></button>
        </div>
        <div className="modal-body">
          {/* User Information */}
          <div className="row mb-4">
            <div className="col-md-6">
              <h6 className="text-primary mb-3">Хэрэглэгчийн мэдээлэл</h6>
              <div className="card bg-light">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    {selectedUserForDetail.photo?.filePath ? (
                      <img
                        src={selectedUserForDetail.photo.filePath}
                        alt={selectedUserForDetail.name}
                        className="rounded-circle me-3"
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3"
                        style={{ width: '80px', height: '80px' }}
                      >
                        <FiUser className="text-white" size={40} />
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1">{selectedUserForDetail.name}</h5>
                      <p className="text-muted mb-0">{selectedUserForDetail.email}</p>
                      {selectedUserForDetail.phone && (
                        <p className="text-muted mb-0">{selectedUserForDetail.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block">Бүртгүүлсэн:</small>
                      <strong>{new Date(selectedUserForDetail.createdAt).toLocaleDateString('mn-MN')}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Хүсэлт илгээсэн:</small>
                      <strong>{new Date(selectedUserForDetail.identityVerification?.requestedAt).toLocaleDateString('mn-MN')}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ID Details */}
            <div className="col-md-6">
              <h6 className="text-primary mb-3">Үнэмлэхний мэдээлэл</h6>
              <div className="card bg-light">
                <div className="card-body">
                  {selectedUserForDetail.identityVerification?.idDetails && (
                    <>
                      {selectedUserForDetail.identityVerification.idDetails.fullName && (
                        <div className="mb-2">
                          <small className="text-muted d-block">Овог нэр:</small>
                          <strong>{selectedUserForDetail.identityVerification.idDetails.fullName}</strong>
                        </div>
                      )}
                      {selectedUserForDetail.identityVerification.idDetails.idNumber && (
                        <div className="mb-2">
                          <small className="text-muted d-block">Үнэмлэхний дугаар:</small>
                          <strong>{selectedUserForDetail.identityVerification.idDetails.idNumber}</strong>
                        </div>
                      )}
                      {selectedUserForDetail.identityVerification.idDetails.dateOfBirth && (
                        <div className="mb-2">
                          <small className="text-muted d-block">Төрсөн огноо:</small>
                          <strong>{new Date(selectedUserForDetail.identityVerification.idDetails.dateOfBirth).toLocaleDateString('mn-MN')}</strong>
                        </div>
                      )}
                      {selectedUserForDetail.identityVerification.idDetails.nationality && (
                        <div className="mb-2">
                          <small className="text-muted d-block">Харьяалал:</small>
                          <strong>{selectedUserForDetail.identityVerification.idDetails.nationality}</strong>
                        </div>
                      )}
                      {selectedUserForDetail.identityVerification.idDetails.expiryDate && (
                        <div className="mb-2">
                          <small className="text-muted d-block">Дуусах хугацаа:</small>
                          <strong>{new Date(selectedUserForDetail.identityVerification.idDetails.expiryDate).toLocaleDateString('mn-MN')}</strong>
                        </div>
                      )}
                    </>
                  )}
                  {(!selectedUserForDetail.identityVerification?.idDetails || Object.keys(selectedUserForDetail.identityVerification.idDetails).length === 0) && (
                    <p className="text-muted mb-0">Үнэмлэхний мэдээлэл байхгүй</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info - Remove after testing */}
          <div className="mb-3">
            <details>
              <summary className="text-muted small" style={{ cursor: 'pointer' }}>Debug: Баримт мэдээлэл харах</summary>
              <pre className="bg-light p-2 rounded small mt-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(selectedUserForDetail.identityVerification?.documents, null, 2)}
              </pre>
            </details>
          </div>

          {/* Verification Documents */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">Баталгаажуулах баримт бичиг</h6>
            <div className="row g-3">
              {/* ID Card Front */}
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body text-center p-2">
                    <small className="text-muted d-block mb-2 fw-bold">Үнэмлэх (Урд тал)</small>
                    {selectedUserForDetail.identityVerification?.documents?.idCardFront?.url ? (
                      <div>
                        <img
                          src={selectedUserForDetail.identityVerification.documents.idCardFront.url}
                          alt="ID Card Front"
                          className="img-fluid rounded border"
                          style={{
                            maxHeight: '250px',
                            width: '100%',
                            objectFit: 'contain',
                            cursor: 'pointer',
                            backgroundColor: '#f8f9fa'
                          }}
                          onClick={() => window.open(selectedUserForDetail.identityVerification.documents.idCardFront.url, '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="bg-light p-4 rounded" style={{ display: 'none' }}>
                          <p className="text-danger mb-0">Зураг ачаалагдсангүй</p>
                          <small className="text-muted d-block">{selectedUserForDetail.identityVerification.documents.idCardFront.url}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light p-4 rounded">
                        <p className="text-muted mb-0">Зураг байхгүй</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ID Card Back */}
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body text-center p-2">
                    <small className="text-muted d-block mb-2 fw-bold">Үнэмлэх (Ар тал)</small>
                    {selectedUserForDetail.identityVerification?.documents?.idCardBack?.url ? (
                      <div>
                        <img
                          src={selectedUserForDetail.identityVerification.documents.idCardBack.url}
                          alt="ID Card Back"
                          className="img-fluid rounded border"
                          style={{
                            maxHeight: '250px',
                            width: '100%',
                            objectFit: 'contain',
                            cursor: 'pointer',
                            backgroundColor: '#f8f9fa'
                          }}
                          onClick={() => window.open(selectedUserForDetail.identityVerification.documents.idCardBack.url, '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="bg-light p-4 rounded" style={{ display: 'none' }}>
                          <p className="text-danger mb-0">Зураг ачаалагдсангүй</p>
                          <small className="text-muted d-block">{selectedUserForDetail.identityVerification.documents.idCardBack.url}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light p-4 rounded">
                        <p className="text-muted mb-0">Зураг байхгүй</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selfie with ID */}
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body text-center p-2">
                    <small className="text-muted d-block mb-2 fw-bold">Үнэмлэх барьсан селфи</small>
                    {selectedUserForDetail.identityVerification?.documents?.selfieWithId?.url ? (
                      <div>
                        <img
                          src={selectedUserForDetail.identityVerification.documents.selfieWithId.url}
                          alt="Selfie with ID"
                          className="img-fluid rounded border"
                          style={{
                            maxHeight: '250px',
                            width: '100%',
                            objectFit: 'contain',
                            cursor: 'pointer',
                            backgroundColor: '#f8f9fa'
                          }}
                          onClick={() => window.open(selectedUserForDetail.identityVerification.documents.selfieWithId.url, '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="bg-light p-4 rounded" style={{ display: 'none' }}>
                          <p className="text-danger mb-0">Зураг ачаалагдсангүй</p>
                          <small className="text-muted d-block">{selectedUserForDetail.identityVerification.documents.selfieWithId.url}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light p-4 rounded">
                        <p className="text-muted mb-0">Зураг байхгүй</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {!showRejectSection && (
            <div className="mb-3">
              <label className="form-label fw-bold">Тэмдэглэл (заавал биш)</label>
              <textarea
                id="adminNotes"
                className="form-control"
                rows="2"
                placeholder="Баталгаажуулалттай холбоотой тэмдэглэл..."
              ></textarea>
            </div>
          )}

          {/* Rejection Reason */}
          {showRejectSection && (
            <div className="mb-3">
              <label className="form-label fw-bold text-danger">Татгалзсан шалтгаан (заавал)</label>
              <textarea
                className="form-control"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Татгалзсан шалтгааныг тодорхой бичнэ үү..."
                autoFocus
              ></textarea>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowUserDetailModal(false);
              setShowRejectSection(false);
              setRejectionReason('');
            }}
          >
            Хаах
          </button>
          {!showRejectSection ? (
            <>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowRejectSection(true)}
              >
                Татгалзах
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  const notes = document.getElementById('adminNotes')?.value || '';
                  handleApproveVerification(selectedUserForDetail._id, notes);
                }}
              >
                <BsCheckCircleFill className="me-2" />
                Баталгаажуулах
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowRejectSection(false);
                  setRejectionReason('');
                }}
              >
                Буцах
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (rejectionReason.trim()) {
                    handleRejectVerification(selectedUserForDetail._id, rejectionReason);
                    setShowRejectSection(false);
                    setRejectionReason('');
                  } else {
                    toast.error('Татгалзсан шалтгаан оруулна уу');
                  }
                }}
              >
                Татгалзах баталгаажуулах
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
)}

         <div className="container mt-n5">
           <div className="row">
             <div className="col-md-3">
               <div className="card shadow-sm border-0 mb-4">
                 <div className="card-body p-0">
                   <ul className="nav flex-column">
                     <li className="nav-item">
                       <button
                         className={`nav-link d-flex align-items-center ${activeTab === 'dashboard' ? 'active' : ''}`}
                         onClick={() => setActiveTab('dashboard')}
                       >
                         <FiShoppingBag className="me-2" />
                         Dashboard
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                     <li className="nav-item">
                       <button 
                         className={`nav-link d-flex align-items-center ${activeTab === 'users' ? 'active' : ''}`}
                         onClick={() => setActiveTab('users')}
                       >
                         <FiUser className="me-2" />
                         Хэрэглэгчид
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                     <li className="nav-item">
                       <button 
                         className={`nav-link d-flex align-items-center ${activeTab === '' ? 'active' : ''}`}
                         onClick={() => setActiveTab('userProducts')}
                         disabled={!selectedUser}
                       >
                         <FiCreditCard className="me-2" />
                         Хэрэглэгчийн бараанууд
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                     <li className="nav-item">
                       <button 
                         className={`nav-link d-flex align-items-center ${activeTab === 'categories'}`}
                         onClick={() => {
                          setActiveTab('categories');
                         }}
                       >
                         <FiUser className="me-2" />
                         Ангилал
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link d-flex align-items-center ${activeTab === 'verifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('verifications')}
                      >
                        <BsCheckCircleFill className="me-2" />
                        Баталгаажуулалт
                        <BsArrowRightShort className="ms-auto" />
                      </button>
                    </li>
                     <li className="nav-item">
                       <button
                         className={`nav-link d-flex align-items-center ${activeTab === 'requests' ? 'active' : ''}`}
                         onClick={() => setActiveTab('requests')}
                       >
                         <FiCreditCard className="me-2" />
                         Дансны хүсэлт
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                     <li className="nav-item">
                       <button
                         className={`nav-link d-flex align-items-center ${activeTab === 'settings' ? 'active' : ''}`}
                         onClick={() => setActiveTab('settings')}
                       >
                         <FiSettings className="me-2" />
                         {t('settings') || 'Тохиргоо'}
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                   </ul>
                 </div>
               </div>
             </div>
   
             <div className="col-md-9">
               {/* Dashboard */}
               {activeTab === 'dashboard' && (
                 <div>
                   <h2 className="mb-4">Dashboard</h2>

                   {/* Statistics Cards */}
                   <div className="row g-4 mb-4">
                     <div className="col-md-3">
                       <div className="card border-0 shadow-sm text-center p-4" style={{backgroundColor: '#f8f9fa'}}>
                         <div className="mb-3">
                           <FiUser size={48} className="text-primary" />
                         </div>
                         <h2 className="mb-0 fw-bold">{totalCount || users.length}</h2>
                         <p className="text-muted mb-0">Total Users</p>
                       </div>
                     </div>

                     <div className="col-md-3">
                       <div className="card border-0 shadow-sm text-center p-4" style={{backgroundColor: '#f8f9fa'}}>
                         <div className="mb-3">
                           <FiShoppingBag size={48} className="text-success" />
                         </div>
                         <h2 className="mb-0 fw-bold">{categories.length}</h2>
                         <p className="text-muted mb-0">Categories</p>
                       </div>
                     </div>

                     <div className="col-md-3">
                       <div className="card border-0 shadow-sm text-center p-4" style={{backgroundColor: '#f8f9fa'}}>
                         <div className="mb-3">
                           <FiCreditCard size={48} className="text-info" />
                         </div>
                         <h2 className="mb-0 fw-bold">{requests.length}</h2>
                         <p className="text-muted mb-0">Pending Requests</p>
                       </div>
                     </div>

                     <div className="col-md-3">
                       <div className="card border-0 shadow-sm text-center p-4" style={{backgroundColor: '#f8f9fa'}}>
                         <div className="mb-3">
                           <BsCheckCircleFill size={48} className="text-warning" />
                         </div>
                         <h2 className="mb-0 fw-bold">{users.filter(u => u.identityVerified).length}</h2>
                         <p className="text-muted mb-0">Verified Users</p>
                       </div>
                     </div>
                   </div>

                   {/* Activity Overview */}
                   <div className="row g-4">
                     <div className="col-md-6">
                       <div className="card border-0 shadow-sm">
                         <div className="card-body">
                           <h5 className="card-title mb-4">Recent Activity</h5>
                           <div className="list-group list-group-flush">
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <div>
                                 <FiUser className="me-2 text-primary" />
                                 <span>New Users</span>
                               </div>
                               <span className="badge bg-primary rounded-pill">{users.length}</span>
                             </div>
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <div>
                                 <BsCheckCircleFill className="me-2 text-success" />
                                 <span>Verified</span>
                               </div>
                               <span className="badge bg-success rounded-pill">{users.filter(u => u.identityVerified).length}</span>
                             </div>
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <div>
                                 <FiClock className="me-2 text-warning" />
                                 <span>Pending Verification</span>
                               </div>
                               <span className="badge bg-warning rounded-pill">
                                 {users.filter(u => u.identityVerification?.status === 'pending').length}
                               </span>
                             </div>
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <div>
                                 <FiCreditCard className="me-2 text-info" />
                                 <span>Balance Requests</span>
                               </div>
                               <span className="badge bg-info rounded-pill">{requests.length}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="col-md-6">
                       <div className="card border-0 shadow-sm">
                         <div className="card-body">
                           <h5 className="card-title mb-4">Category Breakdown</h5>
                           <div className="list-group list-group-flush">
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <span>Parent Categories</span>
                               <span className="badge bg-primary rounded-pill">
                                 {categories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)).length}
                               </span>
                             </div>
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <span>Subcategories</span>
                               <span className="badge bg-secondary rounded-pill">
                                 {categories.filter(c => c.parent && c.parent !== null).length}
                               </span>
                             </div>
                             <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                               <span>Total Categories</span>
                               <span className="badge bg-success rounded-pill">{categories.length}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
                {activeTab === 'users' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="card-title mb-0">Хэрэглэгчид</h4>
        <span className="badge bg-secondary">{totalCount || users.length} Хэрэглэгчид</span>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Нэр, имэйл, утас..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleSearch}
            >
              <FiSearch />
            </button>
          </div>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Бүх баталгаажуулалт</option>
            <option value="verified">Баталгаажсан</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="rejected">Татгалзсан</option>
            <option value="unverified">Баталгаажаагүй</option>
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Бүх үүрэг</option>
            <option value="admin">Админ</option>
            <option value="buyer">Хэрэглэгч</option>
          </select>
        </div>

        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
              setVerificationFilter('');
              setPage(1);
              handleSearch();
            }}
          >
            Цэвэрлэх
          </button>
        </div>
      </div>

      {/* Pagination Info */}
      {totalCount > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <small className="text-muted">
            Нийт {totalCount} хэрэглэгч, {Math.ceil(totalCount / limit)} хуудас
          </small>
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Өмнөх
            </button>
            <button className="btn btn-sm btn-outline-secondary disabled">
              {page}
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= Math.ceil(totalCount / limit)}
              onClick={() => setPage(p => p + 1)}
            >
              Дараах
            </button>
          </div>
        </div>
      )}

      {/* Table View */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Хэрэглэгчийг дуудаж байна...</p>
        </div>
      ) : error ? (
        <div className="alert alert-warning">
          <p>{error}</p>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => window.location.reload()}
          >
            Дахин оролдох
          </button>
        </div>
      ) : users.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Хэрэглэгч</th>
                <th>Имэйл</th>
                <th>Утас</th>
                <th>Үлдэгдэл</th>
                <th>Баталгаажуулалт</th>
                <th>Үүрэг</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  style={{ cursor: 'pointer' }}
                  className="hover-row"
                >
                  <td>
                    <div className="d-flex align-items-center">
                      {user.photo?.filePath ? (
                        <img
                          src={user.photo.filePath}
                          alt={user.name}
                          className="rounded-circle me-2"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <FiUser className="text-white" />
                        </div>
                      )}
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td className="fw-bold text-success">{user.balance?.toFixed(2) || '0.00'}₮</td>
                  <td>
                    {user.identityVerified ? (
                      <span className="badge bg-success">
                        <BsCheckCircleFill className="me-1" />
                        Баталгаажсан
                      </span>
                    ) : user.identityVerification?.status === 'pending' ? (
                      <span className="badge bg-warning text-dark">
                        Хүлээгдэж буй
                      </span>
                    ) : user.identityVerification?.status === 'rejected' ? (
                      <span className="badge bg-danger">
                        Татгалзсан
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        Баталгаажаагүй
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      user.role === 'admin' ? 'bg-danger' :
                      user.role === 'moderator' ? 'bg-warning text-dark' : 'bg-primary'
                    }`}>
                      {user.role === 'admin' ? 'Админ' : user.role === 'moderator' ? 'Модератор' : 'Хэрэглэгч'}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBalanceClick(user._id);
                        }}
                        title="Данс цэнэглэх"
                      >
                        Данс +
                      </button>
                      <button
                        className="btn btn-outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchUserProducts(user._id);
                        }}
                        title="Бараануудыг үзэх"
                      >
                        Бараа
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Хэрэглэгч олдсонгүй</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
              setVerificationFilter('');
              setPage(1);
              handleSearch();
            }}
          >
            Бүх хэрэглэгчийг харах
          </button>
        </div>
      )}
    </div>
  </div>
)}
        {activeTab === 'userProducts' && (
        <div className="card border-0 shadow-sm">
            <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title mb-0">Хэрэглэгчийн бараанууд</h4>
                <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    setSelectedUser(null);
                    setActiveTab('users');
                }}
                >
                Буцах
                </button>
            </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading user's products...</p>
        </div>
      ) : error ? (
        <div className="alert alert-warning">
          <p>Whoops! {error}</p>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => fetchUserProducts(selectedUser)}
          >
            Try Again
          </button>
        </div>
      ) : userProducts.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {userProducts.map((product) => (
            <div className="col" key={product._id}>
              <div className="card h-100">
                {product.image?.filePath && (
                  <img 
                    src={product.image.filePath} 
                    className="card-img-top" 
                    alt={product.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{product.title}</h5>
                  <p className="card-text text-truncate">{product.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">${product.price}</span>
                    <span className={`badge ${product.sold ? 'bg-success' : 'bg-secondary'}`}>
                      {product.sold ? 'Sold' : 'Available'}
                    </span>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      Үзэх
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Энэ хэрэглэгчид бараа байхгүй байна</p>
        </div>
      )}
    </div>
  </div>
)}
        {activeTab === 'requests' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="card-title mb-0">Дансны цэнэглэлтийн хүсэлт</h4>
        <span className="badge bg-secondary">{requests.length} хүсэлт</span>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Түр хүлээнэ үү...</p>
        </div>
      ) : error ? (
        <div className="alert alert-warning">
          <p>Алдаа гарлаа! {error}</p>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => window.location.reload()}
          >
            Дахин оролдох
          </button>
        </div>
      ) : requests.length > 0 ? (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Хэрэглэгч</th>
                <th>Хэмжээ</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr key={request._id}>
                  <td>{index + 1}</td>
                  <td>{request.user?.name || 'Unknown'}</td>
                  <td>{request.amount || '00'}₮</td>
                  <td>
                    <div className="btn-group">
                    <button 
  className="btn btn-sm btn-success"
  onClick={() => handleApproveRequest(request._id, request.user._id, request.amount)}
>
  Зөвшөөрөх
</button>
<button 
  className="btn btn-sm btn-danger"
  onClick={() => handleDeleteRequest(request._id)}
>
  Татгалзах
</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Ямар нэгэн хүсэлт ирээгүй байна</p>
        </div>
      )}
    </div>
  </div>
)}
{activeTab === 'categories' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="card-title mb-0">Ангилал удирдлага</h4>
        <div>
          <span className="badge bg-primary me-2">
            {categories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)).length} үндсэн ангилал
          </span>
          <span className="badge bg-secondary">
            {categories.filter(c => c.parent && c.parent !== null).length} дэд ангилал
          </span>
        </div>
      </div>

      {categoryError && (
        <div className="alert alert-danger">{categoryError}</div>
      )}

      {categorySuccess && (
        <div className="alert alert-success">{categorySuccess}</div>
      )}

      <div className="row">
        <div className="col-md-5">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Шинэ ангилал нэмэх</h5>

              {/* Toggle between parent and subcategory */}
              <div className="btn-group mb-3 w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="categoryType"
                  id="parentType"
                  checked={!parentCategory}
                  onChange={() => setParentCategory('')}
                />
                <label className="btn btn-outline-primary" htmlFor="parentType">
                  Үндсэн ангилал
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="categoryType"
                  id="subType"
                  checked={!!parentCategory}
                  onChange={() => {
                    // Select first parent if exists
                    const firstParent = categories.find(c => !c.parent || (typeof c.parent === 'object' && c.parent === null));
                    if (firstParent) setParentCategory(firstParent._id);
                  }}
                />
                <label className="btn btn-outline-primary" htmlFor="subType">
                  Дэд ангилал
                </label>
              </div>

              {/* If subcategory, select parent */}
              {parentCategory && (
                <div className="mb-3">
                  <label className="form-label">Үндсэн ангилал сонгох</label>
                  <select
                    className="form-select"
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                  >
                    <option value="">Үндсэн ангилал сонгох</option>
                    {categories
                      .filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null))
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {language === 'MN' ? (cat.titleMn || cat.title) : cat.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={parentCategory ? "Дэд ангилалын нэр" : "Үндсэн ангилалын нэр"}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('addCategoryBtn').click();
                    }
                  }}
                />
                <button
                  id="addCategoryBtn"
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!newCategory.trim()) {
                      setCategoryError('Ангилалын нэр оруулна уу');
                      return;
                    }

                    try {
                      const token = JSON.parse(localStorage.getItem('user'))?.token;
                      const payload = {
                        title: newCategory
                      };

                      if (parentCategory) {
                        payload.parent = parentCategory;
                      }

                      await axios.post(
                        'http://localhost:5000/api/category/',
                        payload,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        }
                      );

                      setNewCategory('');
                      setCategoryError(null);
                      setCategorySuccess(parentCategory ? 'Дэд ангилал амжилттай үүслээ!' : 'Үндсэн ангилал амжилттай үүслээ!');
                      fetchCategories();

                      setTimeout(() => setCategorySuccess(null), 3000);
                    } catch (error) {
                      setCategoryError(error.response?.data?.message || 'Ангилал үүсгэхэд алдаа гарлаа');
                    }
                  }}
                >
                  Нэмэх
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ангилалын бүтэц</h5>

              {loading ? (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : categories.length > 0 ? (
                <div className="category-tree">
                  {categories
                    .filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null))
                    .map((parentCat) => {
                      const subs = categories.filter(c =>
                        c.parent &&
                        ((typeof c.parent === 'string' && c.parent === parentCat._id) ||
                         (typeof c.parent === 'object' && c.parent?._id === parentCat._id))
                      );

                      return (
                        <div key={parentCat._id} className="mb-3">
                          <div className="list-group-item bg-light border">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{language === 'MN' ? (parentCat.titleMn || parentCat.title) : parentCat.title}</strong>
                                <span className="badge bg-secondary ms-2">{subs.length} дэд ангилал</span>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={async () => {
                                  if (subs.length > 0) {
                                    setCategoryError('Дэд ангилал бүхий үндсэн ангилалыг устгах боломжгүй!');
                                    setTimeout(() => setCategoryError(null), 3000);
                                    return;
                                  }

                                  if (window.confirm(`Та "${parentCat.title}" ангилалыг устгахдаа итгэлтэй байна уу?`)) {
                                    try {
                                      const token = JSON.parse(localStorage.getItem('user'))?.token;
                                      await axios.delete(
                                        `http://localhost:5000/api/category/${parentCat._id}`,
                                        { headers: { Authorization: `Bearer ${token}` }}
                                      );
                                      fetchCategories();
                                      setCategorySuccess('Ангилал амжилттай устгагдлаа!');
                                      setTimeout(() => setCategorySuccess(null), 3000);
                                    } catch (error) {
                                      setCategoryError('Ангилал устгахэд алдаа гарлаа');
                                    }
                                  }
                                }}
                              >
                                Устгах
                              </button>
                            </div>
                          </div>

                          {subs.length > 0 && (
                            <div className="ms-4 mt-2">
                              {subs.map((subCat) => (
                                <div
                                  key={subCat._id}
                                  className="list-group-item border-start-0 border-end-0 py-2"
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="text-muted">
                                      ↳ {language === 'MN' ? (subCat.titleMn || subCat.title) : subCat.title}
                                    </div>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={async () => {
                                        if (window.confirm(`Та "${subCat.title}" дэд ангилалыг устгахдаа итгэлтэй байна уу?`)) {
                                          try {
                                            const token = JSON.parse(localStorage.getItem('user'))?.token;
                                            await axios.delete(
                                              `http://localhost:5000/api/category/${subCat._id}`,
                                              { headers: { Authorization: `Bearer ${token}` }}
                                            );
                                            fetchCategories();
                                            setCategorySuccess('Дэд ангилал амжилттай устгагдлаа!');
                                            setTimeout(() => setCategorySuccess(null), 3000);
                                          } catch (error) {
                                            setCategoryError('Дэд ангилал устгахэд алдаа гарлаа');
                                          }
                                        }
                                      }}
                                    >
                                      Устгах
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted">Ангилал байхгүй байна</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{activeTab === 'verifications' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="card-title mb-0">
          <BsCheckCircleFill className="me-2" />
          Баталгаажуулалт шалгах
        </h4>
        <div>
          {verificationStats && (
            <>
              <span className="badge bg-warning me-2">
                {verificationStats.pending} Хүлээгдэж буй
              </span>
              <span className="badge bg-success me-2">
                {verificationStats.verified} Баталгаажсан
              </span>
              <span className="badge bg-danger">
                {verificationStats.rejected} Татгалзсан
              </span>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Баталгаажуулалт татаж байна...</p>
        </div>
      ) : error ? (
        <div className="alert alert-warning">
          <p>{error}</p>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchPendingVerifications}
          >
            Дахин оролдох
          </button>
        </div>
      ) : pendingVerifications.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {pendingVerifications.map((user) => (
            <div className="col" key={user._id}>
              <div className="card h-100 hover-shadow" style={{ cursor: 'pointer' }} onClick={() => handleUserClick(user)}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    {user.photo?.filePath ? (
                      <img
                        src={user.photo.filePath}
                        alt={user.name}
                        className="rounded-circle me-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3"
                        style={{ width: '60px', height: '60px' }}
                      >
                        <FiUser className="text-white" size={30} />
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{user.name}</h5>
                      <p className="text-muted mb-0 small">{user.email}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">
                      <FiClock className="me-1" />
                      Хүсэлт илгээсэн: {new Date(user.identityVerification?.requestedAt).toLocaleDateString('mn-MN')}
                    </small>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-warning text-dark">
                      Хүлээгдэж буй
                    </span>
                    <small className="text-primary">Үзэх →</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <BsCheckCircleFill size={48} className="text-muted mb-3" />
          <p className="text-muted">Хүлээгдэж буй баталгаажуулалт байхгүй байна</p>
        </div>
      )}
    </div>
  </div>
)}

{activeTab === 'settings' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FiSettings className="me-2" />
          {t('settings') || 'Системийн тохиргоо'}
        </h4>
      </div>

      {/* Appearance Settings */}
      <div className="settings-section mb-4">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <FiSun className="me-2" />
          {t('appearance') || 'Харагдац'}
        </h5>
        <div className="card bg-light border-0 p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">
                {isDarkMode ? <FiMoon className="me-2" /> : <FiSun className="me-2" />}
                {t('darkMode') || 'Харанхуй горим'}
              </h6>
              <small className="text-muted">Интерфейсийн өнгийн тохиргоо</small>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="darkModeSwitch"
                checked={isDarkMode}
                onChange={toggleTheme}
                style={{ width: '3em', height: '1.5em', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="settings-section mb-4">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <FiSettings className="me-2" />
          Платформын тохиргоо
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold">Сайтын нэр</label>
            <input type="text" className="form-control" defaultValue="Auction Platform" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Холбоо барих имэйл</label>
            <input type="email" className="form-control" defaultValue="admin@auction.mn" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Холбоо барих утас</label>
            <input type="tel" className="form-control" defaultValue="+976 7000-0000" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Цагийн бүс</label>
            <select className="form-select">
              <option value="Asia/Ulaanbaatar" selected>Asia/Ulaanbaatar (UTC+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            </select>
          </div>
          <div className="col-12">
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="maintenanceMode" />
              <label className="form-check-label fw-bold" htmlFor="maintenanceMode">
                Засвар үйлчилгээний горим
                <small className="d-block text-muted fw-normal">Идэвхжүүлбэл зөвхөн админ нэвтрэх боломжтой</small>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Structure */}
      <div className="settings-section mb-4">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <FiCreditCard className="me-2" />
          Төлбөр, хураамж
        </h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-bold">Борлуулалтын комисс (%)</label>
            <input type="number" className="form-control" defaultValue="5" min="0" max="100" step="0.1" />
            <small className="text-muted">Бараа зарагдах үед худалдагчаас суутгах хувь</small>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Бүртгэлийн хураамж (₮)</label>
            <input type="number" className="form-control" defaultValue="0" min="0" />
            <small className="text-muted">Шинэ бараа оруулахад төлөх хураамж</small>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Баталгаажуулалтын хураамж (₮)</label>
            <input type="number" className="form-control" defaultValue="5000" min="0" />
            <small className="text-muted">Хэрэглэгч баталгаажуулах үйлчилгээ</small>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Хамгийн бага зарах үнэ (₮)</label>
            <input type="number" className="form-control" defaultValue="1000" min="0" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Хамгийн их зарах үнэ (₮)</label>
            <input type="number" className="form-control" defaultValue="100000000" min="0" />
          </div>
        </div>
      </div>

      {/* Verification Settings */}
      <div className="settings-section mb-4">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <BsCheckCircleFill className="me-2" />
          Баталгаажуулалтын тохиргоо
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold">Шалгах хугацаа (цаг)</label>
            <input type="number" className="form-control" defaultValue="48" min="1" />
            <small className="text-muted">Баталгаажуулалт шалгах дээд хугацаа</small>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Итгэл үнэлгээ өсгөх хэмжээ</label>
            <input type="number" className="form-control" defaultValue="20" min="0" max="100" />
            <small className="text-muted">Баталгаажсаны дараа нэмэгдэх оноо</small>
          </div>
          <div className="col-12">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="requireVerificationToSell" defaultChecked />
              <label className="form-check-label fw-bold" htmlFor="requireVerificationToSell">
                Зарах эрх баталгаажуулалттай байх
                <small className="d-block text-muted fw-normal">Баталгаажаагүй хэрэглэгч бараа оруулах боломжгүй</small>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="settings-section mb-4">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <FiUser className="me-2" />
          Мэдэгдэл, имэйл
        </h5>
        <div className="row g-2">
          <div className="col-md-6">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="emailNewUser" defaultChecked />
              <label className="form-check-label" htmlFor="emailNewUser">
                Шинэ хэрэглэгч бүртгүүлэх үед имэйл илгээх
              </label>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="emailVerificationApproved" defaultChecked />
              <label className="form-check-label" htmlFor="emailVerificationApproved">
                Баталгаажуулалт зөвшөөрөгдөх үед имэйл илгээх
              </label>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="emailAuctionWon" defaultChecked />
              <label className="form-check-label" htmlFor="emailAuctionWon">
                Дуудлага худалдаа ялах үед имэйл илгээх
              </label>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="emailOutbid" defaultChecked />
              <label className="form-check-label" htmlFor="emailOutbid">
                Санал хүчингүй болох үед имэйл илгээх
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="settings-section mb-4">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <FiSettings className="me-2" />
          Аюулгүй байдал
        </h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold">Нэвтрэх оролдлогын лимит</label>
            <input type="number" className="form-control" defaultValue="5" min="1" max="10" />
            <small className="text-muted">Буруу нэвтрэх оролдлогын тоо</small>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Хаалтын хугацаа (минут)</label>
            <input type="number" className="form-control" defaultValue="30" min="1" />
            <small className="text-muted">Лимит давсны дараа хааж байх хугацаа</small>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Session timeout (минут)</label>
            <input type="number" className="form-control" defaultValue="60" min="5" />
            <small className="text-muted">Автоматаар гарах хугацаа</small>
          </div>
          <div className="col-md-6">
            <div className="form-check mt-4">
              <input className="form-check-input" type="checkbox" id="require2FA" />
              <label className="form-check-label fw-bold" htmlFor="require2FA">
                2-Factor Authentication шаардах
                <small className="d-block text-muted fw-normal">Админд нэвтрэх үед SMS баталгаажуулалт</small>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="settings-section">
        <h5 className="mb-3 text-primary border-bottom pb-2">
          <FiSettings className="me-2" />
          Системийн мэдээлэл
        </h5>
        <div className="row">
          <div className="col-md-3">
            <div className="card text-center p-3 bg-light">
              <h2 className="text-primary mb-0">{totalCount || users.length}</h2>
              <small className="text-muted">Нийт хэрэглэгч</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3 bg-light">
              <h2 className="text-success mb-0">{categories.filter(c => !c.parent).length}</h2>
              <small className="text-muted">Үндсэн ангилал</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3 bg-light">
              <h2 className="text-warning mb-0">{requests.length}</h2>
              <small className="text-muted">Хүлээгдэж буй хүсэлт</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center p-3 bg-light">
              <h2 className="text-info mb-0">v1.0.0</h2>
              <small className="text-muted">Системийн хувилбар</small>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-4 text-end">
        <button className="btn btn-outline-secondary me-2">Буцаах</button>
        <button className="btn btn-primary">
          <FiSettings className="me-2" />
          Хадгалах
        </button>
      </div>
    </div>
  </div>
)}


             </div>
           </div>
         </div></div>
         )}
export default Admin;
