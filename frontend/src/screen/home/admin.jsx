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
  };fetchCategories();}, []); // Added empty dependency array to run only once on mount
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


  const handleDeleteUser = async (u) => {
    if (!window.confirm(`"${u.name}" хэрэглэгчийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      await axios.delete(`http://localhost:5000/api/users/${u._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.filter(x => x._id !== u._id));
      setTotalCount(prev => prev - 1);
      toast.success(`"${u.name}" устгагдлаа`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Хэрэглэгч устгахад алдаа гарлаа');
    }
  };

  const tabTitles = { dashboard: 'Хянах самбар', users: 'Хэрэглэгчид', userProducts: 'Хэрэглэгчийн бараанууд', categories: 'Ангилал удирдлага', verifications: 'Баталгаажуулалт', requests: 'Дансны хүсэлт', settings: 'Тохиргоо' };
  const s = { card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }, tag: (bg, color) => ({ background: bg, color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }), btn: (bg, color, border) => ({ padding: '8px 18px', borderRadius: 10, border: border || 'none', background: bg, color, cursor: 'pointer', fontWeight: 600, fontSize: 14 }) };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Add Balance Modal ── */}
      {showAddBalanceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: 420, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Данс цэнэглэх</h3>
              <button onClick={() => setShowAddBalanceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{error}</div>}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Дүн (₮)</label>
              <input type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} min="1000" step="1000"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>Хамгийн бага дүн: 1,000₮</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddBalanceModal(false)} disabled={loading} style={s.btn('transparent', '#475569', '1.5px solid #e2e8f0')}>Цуцлах</button>
              <button onClick={handleBalanceSubmit} disabled={loading} style={s.btn('var(--bn-primary)', '#fff')}>
                {loading ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {showUserDetailModal && selectedUserForDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 920, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Баталгаажуулалт — {selectedUserForDetail.name}</h3>
              <button onClick={() => setShowUserDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Хэрэглэгчийн мэдээлэл</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    {selectedUserForDetail.photo?.filePath ? <img src={selectedUserForDetail.photo.filePath} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser size={26} color="#94a3b8" /></div>}
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 3px' }}>{selectedUserForDetail.name}</p>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selectedUserForDetail.email}</p>
                      {selectedUserForDetail.phone && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selectedUserForDetail.phone}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['Бүртгүүлсэн', new Date(selectedUserForDetail.createdAt).toLocaleDateString('mn-MN')],
                      ['Хүсэлт илгээсэн', new Date(selectedUserForDetail.identityVerification?.requestedAt).toLocaleDateString('mn-MN')]].map(([label, val]) => (
                      <div key={label}><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{label}</p><p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{val}</p></div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Үнэмлэхний мэдээлэл</p>
                  {selectedUserForDetail.identityVerification?.idDetails && Object.keys(selectedUserForDetail.identityVerification.idDetails).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[['fullName','Овог нэр'], ['idNumber','Үнэмлэхний дугаар'], ['nationality','Харьяалал']].map(([key, label]) =>
                        selectedUserForDetail.identityVerification.idDetails[key] && (
                          <div key={key}><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 1px' }}>{label}</p>
                          <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{selectedUserForDetail.identityVerification.idDetails[key]}</p></div>
                        )
                      )}
                      {selectedUserForDetail.identityVerification.idDetails.dateOfBirth && (
                        <div><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 1px' }}>Төрсөн огноо</p>
                        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{new Date(selectedUserForDetail.identityVerification.idDetails.dateOfBirth).toLocaleDateString('mn-MN')}</p></div>
                      )}
                      {selectedUserForDetail.identityVerification.idDetails.expiryDate && (
                        <div><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 1px' }}>Дуусах хугацаа</p>
                        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{new Date(selectedUserForDetail.identityVerification.idDetails.expiryDate).toLocaleDateString('mn-MN')}</p></div>
                      )}
                    </div>
                  ) : <p style={{ fontSize: 13, color: '#94a3b8' }}>Үнэмлэхний мэдээлэл байхгүй</p>}
                </div>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Баталгаажуулах баримт бичиг</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[{ key: 'idCardFront', label: 'Үнэмлэх — Урд тал' }, { key: 'idCardBack', label: 'Үнэмлэх — Ар тал' }, { key: 'selfieWithId', label: 'Үнэмлэх барьсан селфи' }].map(({ key, label }) => {
                  const doc = selectedUserForDetail.identityVerification?.documents?.[key];
                  return (
                    <div key={key} style={{ background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <p style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#475569', borderBottom: '1px solid #e2e8f0', margin: 0 }}>{label}</p>
                      {doc?.url ? <img src={doc.url} alt={label} onClick={() => window.open(doc.url, '_blank')} style={{ width: '100%', height: 200, objectFit: 'contain', cursor: 'pointer', background: '#fff' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Зураг байхгүй</div>}
                    </div>
                  );
                })}
              </div>
              {!showRejectSection ? (
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Тэмдэглэл (заавал биш)</label>
                  <textarea id="adminNotes" rows="2" placeholder="Баталгаажуулалттай холбоотой тэмдэглэл..."
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, resize: 'vertical', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>Татгалзсан шалтгаан (заавал)</label>
                  <textarea rows="3" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Татгалзсан шалтгааныг тодорхой бичнэ үү..." autoFocus
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #fca5a5', borderRadius: 10, resize: 'vertical', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              )}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowUserDetailModal(false); setShowRejectSection(false); setRejectionReason(''); }} style={s.btn('transparent', '#475569', '1.5px solid #e2e8f0')}>Хаах</button>
              {!showRejectSection ? (<>
                <button onClick={() => setShowRejectSection(true)} style={s.btn('#fee2e2', '#dc2626')}>Татгалзах</button>
                <button onClick={() => { const notes = document.getElementById('adminNotes')?.value || ''; handleApproveVerification(selectedUserForDetail._id, notes); }} style={s.btn('#22c55e', '#fff')}>
                  <BsCheckCircleFill style={{ marginRight: 6 }} />Баталгаажуулах
                </button>
              </>) : (<>
                <button onClick={() => { setShowRejectSection(false); setRejectionReason(''); }} style={s.btn('transparent', '#475569', '1.5px solid #e2e8f0')}>Буцах</button>
                <button onClick={() => { if (rejectionReason.trim()) { handleRejectVerification(selectedUserForDetail._id, rejectionReason); setShowRejectSection(false); setRejectionReason(''); } else { toast.error('Татгалзсан шалтгаан оруулна уу'); } }} style={s.btn('#dc2626', '#fff')}>
                  Татгалзах баталгаажуулах
                </button>
              </>)}
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Админ самбар</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bn-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Администратор</p>
            </div>
          </div>
          <div style={{ background: 'rgba(79,70,229,0.15)', borderRadius: 8, padding: '7px 12px', fontSize: 14, fontWeight: 700, color: 'var(--bn-primary)' }}>
            {user.balance?.toLocaleString() || '0'}₮
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {[
            { tab: 'dashboard', Icon: FiShoppingBag, label: 'Хянах самбар' },
            { tab: 'users', Icon: FiUser, label: 'Хэрэглэгчид' },
            { tab: 'userProducts', Icon: FiCreditCard, label: 'Хэрэглэгчийн бараа', disabled: !selectedUser },
            { tab: 'categories', Icon: FiSettings, label: 'Ангилал' },
            { tab: 'verifications', Icon: BsCheckCircleFill, label: 'Баталгаажуулалт' },
            { tab: 'requests', Icon: FiCreditCard, label: 'Дансны хүсэлт' },
            { tab: 'settings', Icon: FiSettings, label: 'Тохиргоо' },
          ].map(({ tab, Icon, label, disabled }) => (
            <button key={tab} onClick={() => !disabled && setActiveTab(tab)} disabled={disabled}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%', fontSize: 14, fontWeight: 500, background: activeTab === tab ? 'rgba(79,70,229,0.12)' : 'transparent', color: activeTab === tab ? 'var(--bn-primary)' : disabled ? '#334155' : '#94a3b8', transition: 'all 0.15s' }}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>
            {isDarkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            {isDarkMode ? 'Цайвар горим' : 'Харанхуй горим'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{tabTitles[activeTab]}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{new Date().toLocaleDateString('mn-MN')}</span>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bn-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: 28, flex: 1 }}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
                {[
                  { label: 'Нийт хэрэглэгч', value: totalCount || users.length, color: '#3b82f6', bg: '#eff6ff', Icon: FiUser },
                  { label: 'Нийт ангилал', value: categories.length, color: '#22c55e', bg: '#f0fdf4', Icon: FiShoppingBag },
                  { label: 'Ирсэн хүсэлт', value: requests.length, color: '#f59e0b', bg: '#fffbeb', Icon: FiCreditCard },
                  { label: 'Баталгаажсан', value: users.filter(u => u.identityVerified).length, color: '#8b5cf6', bg: '#f5f3ff', Icon: BsCheckCircleFill },
                ].map(({ label, value, color, bg, Icon }) => (
                  <div key={label} style={{ ...s.card, padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={color} />
                      </div>
                      <span style={{ fontSize: 34, fontWeight: 800, color: '#0f172a' }}>{value}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={s.card}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Шинэчлэлт</h3>
                  {[
                    { label: 'Нэмэгдсэн хэрэглэгч', value: users.length, color: '#3b82f6', bg: '#eff6ff', Icon: FiUser },
                    { label: 'Баталгаажсан', value: users.filter(u => u.identityVerified).length, color: '#22c55e', bg: '#f0fdf4', Icon: BsCheckCircleFill },
                    { label: 'Хүлээгдэж буй баталгаажуулалт', value: users.filter(u => u.identityVerification?.status === 'pending').length, color: '#f59e0b', bg: '#fffbeb', Icon: FiClock },
                    { label: 'Дансны хүсэлт', value: requests.length, color: '#6366f1', bg: '#eef2ff', Icon: FiCreditCard },
                  ].map(({ label, value, color, bg, Icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={color} /></div>
                        <span style={{ fontSize: 14, color: '#374151' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={s.card}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Ангилалын статистик</h3>
                  {[
                    { label: 'Эх категори', value: categories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)).length, color: '#3b82f6' },
                    { label: 'Охин категори', value: categories.filter(c => c.parent && c.parent !== null).length, color: '#64748b' },
                    { label: 'Нийт категори', value: categories.length, color: '#22c55e' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 14, color: '#374151' }}>{label}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Хэрэглэгчид</h2>
                <span style={s.tag('#f1f5f9', '#475569')}>{totalCount || users.length} нийт</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flex: 1, minWidth: 220 }}>
                  <input type="text" placeholder="Нэр, имэйл, утас..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ flex: 1, padding: '9px 14px', border: 'none', outline: 'none', fontSize: 14 }} />
                  <button onClick={handleSearch} style={{ padding: '9px 14px', border: 'none', background: '#f8fafc', cursor: 'pointer', borderLeft: '1.5px solid #e2e8f0' }}><FiSearch size={15} color="#94a3b8" /></button>
                </div>
                <select value={verificationFilter} onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                  style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="">Бүх баталгаажуулалт</option>
                  <option value="verified">Баталгаажсан</option><option value="pending">Хүлээгдэж буй</option>
                  <option value="rejected">Татгалзсан</option><option value="unverified">Баталгаажаагүй</option>
                </select>
                <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="">Бүх үүрэг</option><option value="admin">Админ</option><option value="buyer">Хэрэглэгч</option>
                </select>
                <button onClick={() => { setSearchTerm(''); setRoleFilter(''); setVerificationFilter(''); setPage(1); handleSearch(); }}
                  style={s.btn('#f8fafc', '#64748b', '1.5px solid #e2e8f0')}>Цэвэрлэх</button>
              </div>
              {totalCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Нийт {totalCount} хэрэглэгч, {Math.ceil(totalCount / limit)} хуудас</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['Өмнөх', page === 1, () => setPage(p => Math.max(1, p - 1))], ['Дараах', page >= Math.ceil(totalCount / limit), () => setPage(p => p + 1)]].map(([label, dis, fn]) => (
                      <button key={label} onClick={fn} disabled={dis} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.4 : 1, fontSize: 13 }}>{label}</button>
                    ))}
                  </div>
                </div>
              )}
              {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border text-primary" role="status" /></div>
                : error ? <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 16, color: '#c2410c', fontSize: 14 }}>{error}</div>
                : users.length > 0 ? (
                <div style={{ overflow: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ background: '#f8fafc' }}>
                      {['Хэрэглэгч', 'Имэйл', 'Утас', 'Үлдэгдэл', 'Баталгаажуулалт', 'Үүрэг', ''].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} onClick={() => handleUserClick(u)} style={{ cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {u.photo?.filePath ? <img src={u.photo.filePath} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser size={16} color="#94a3b8" /></div>}
                              <span style={{ fontWeight: 600 }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', color: '#64748b' }}>{u.email}</td>
                          <td style={{ padding: '13px 16px', color: '#64748b' }}>{u.phone || '—'}</td>
                          <td style={{ padding: '13px 16px', fontWeight: 700, color: '#16a34a' }}>{u.balance?.toFixed(2) || '0.00'}₮</td>
                          <td style={{ padding: '13px 16px' }}>
                            {u.identityVerified ? <span style={s.tag('#dcfce7', '#15803d')}>Баталгаажсан</span>
                              : u.identityVerification?.status === 'pending' ? <span style={s.tag('#fef9c3', '#854d0e')}>Хүлээгдэж буй</span>
                              : u.identityVerification?.status === 'rejected' ? <span style={s.tag('#fee2e2', '#dc2626')}>Татгалзсан</span>
                              : <span style={s.tag('#f1f5f9', '#64748b')}>Баталгаажаагүй</span>}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={s.tag(u.role === 'admin' ? '#fee2e2' : '#eff6ff', u.role === 'admin' ? '#dc2626' : '#3b82f6')}>
                              {u.role === 'admin' ? 'Админ' : u.role === 'moderator' ? 'Модератор' : 'Хэрэглэгч'}
                            </span>
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={(e) => { e.stopPropagation(); handleAddBalanceClick(u._id); }}
                                style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #22c55e', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Данс +</button>
                              <button onClick={(e) => { e.stopPropagation(); fetchUserProducts(u._id); }}
                                style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Бараа</button>
                              {u.role !== 'admin' && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                                  style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #ef4444', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Устгах</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <FiUser size={48} color="#e2e8f0" style={{ marginBottom: 14 }} />
                  <p style={{ color: '#94a3b8', marginBottom: 16 }}>Хэрэглэгч олдсонгүй</p>
                  <button onClick={() => { setSearchTerm(''); setRoleFilter(''); setVerificationFilter(''); setPage(1); handleSearch(); }} style={s.btn('var(--bn-primary)', '#fff')}>Бүх хэрэглэгчийг харах</button>
                </div>
              )}
            </div>
          )}

          {/* USER PRODUCTS */}
          {activeTab === 'userProducts' && (
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Хэрэглэгчийн бараанууд</h2>
                <button onClick={() => { setSelectedUser(null); setActiveTab('users'); }} style={s.btn('#f8fafc', '#475569', '1.5px solid #e2e8f0')}>← Буцах</button>
              </div>
              {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border text-primary" role="status" /></div>
                : error ? <div style={{ background: '#fff7ed', borderRadius: 10, padding: 16, color: '#c2410c' }}>Алдаа! {error}</div>
                : userProducts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {userProducts.map((product) => (
                    <div key={product._id} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', display: 'grid', gridTemplateColumns: '180px 1fr 210px' }}>
                      <div style={{ background: '#f8fafc' }}>
                        {product.images?.length > 0 ? <img src={product.images[0].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 150 }} />
                          : <div style={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiShoppingBag size={36} color="#d1d5db" /></div>}
                      </div>
                      <div style={{ padding: 20, borderRight: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                          <h4 style={{ fontWeight: 700, fontSize: 15, margin: 0, flex: 1 }}>{product.title}</h4>
                          <span style={s.tag(product.sold ? '#dcfce7' : product.available ? '#eff6ff' : '#f1f5f9', product.sold ? '#15803d' : product.available ? '#3b82f6' : '#64748b')}>
                            {product.sold ? 'Зарагдсан' : product.available ? 'Идэвхтэй' : 'Идэвхгүй'}
                          </span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{product.description?.substring(0, 110)}...</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          {[['Эхлэх үнэ', `₮${product.price?.toLocaleString()}`, '#3b82f6'], ['Одоогийн үнэ', `₮${(product.currentBid || product.price)?.toLocaleString()}`, '#22c55e'],
                            ['Ангилал', product.category?.title || 'Тодорхойгүй', '#0f172a'], ['Дуусах хугацаа', product.bidDeadline ? new Date(product.bidDeadline).toLocaleDateString('mn-MN') : '—', '#0f172a']].map(([label, val, color]) => (
                            <div key={label}><p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>{label}</p><p style={{ fontSize: 13, fontWeight: 700, color, margin: 0 }}>{val}</p></div>
                          ))}
                        </div>
                        <button onClick={() => window.open(`/product/${product.slug}`, '_blank')} style={s.btn('#f8fafc', '#475569', '1.5px solid #e2e8f0')}>Дэлгэрэнгүй →</button>
                      </div>
                      <div style={{ padding: 16 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Статистик</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                          {[['Санал', product.bidStats?.totalBids || 0, '#3b82f6'], ['Оролцогч', product.bidStats?.totalBidders || 0, '#22c55e'], ['Үзсэн', product.bidStats?.views || 0, '#f59e0b']].map(([label, val, color]) => (
                            <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '9px 6px', textAlign: 'center' }}>
                              <p style={{ fontSize: 18, fontWeight: 800, color, margin: '0 0 2px' }}>{val}</p>
                              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{label}</p>
                            </div>
                          ))}
                        </div>
                        {product.bidStats?.allBids?.length > 0 ? (
                          <div style={{ overflowY: 'auto', maxHeight: 150, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {product.bidStats.allBids.map((bid, i) => (
                              <div key={bid._id} style={{ background: i === 0 ? '#fff8f0' : '#f8fafc', borderRadius: 8, padding: '8px 10px', border: i === 0 ? '1.5px solid #fed7aa' : '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div><p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 1px' }}>{bid.user?.name || 'Unknown'}</p>
                                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{new Date(bid.createdAt).toLocaleString('mn-MN')}</p></div>
                                  <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--bn-accent)', margin: 0 }}>₮{bid.price?.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '16px 0' }}>Үнийн санал байхгүй</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}><FiShoppingBag size={48} color="#e2e8f0" style={{ marginBottom: 14 }} /><p style={{ color: '#94a3b8' }}>Энэ хэрэглэгчид бараа байхгүй байна</p></div>
              )}
            </div>
          )}

          {/* REQUESTS */}
          {activeTab === 'requests' && (
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Дансны цэнэглэлтийн хүсэлт</h2>
                <span style={s.tag('#f1f5f9', '#475569')}>{requests.length} хүсэлт</span>
              </div>
              {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border text-primary" role="status" /></div>
                : error ? <div style={{ background: '#fff7ed', borderRadius: 10, padding: 16, color: '#c2410c' }}>Алдаа! {error}</div>
                : requests.length > 0 ? (
                <div style={{ overflow: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ background: '#f8fafc' }}>
                      {['#', 'Хэрэглэгч', 'Дүн', 'Үйлдэл'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {requests.map((req, i) => (
                        <tr key={req._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '13px 16px', color: '#94a3b8' }}>{i + 1}</td>
                          <td style={{ padding: '13px 16px', fontWeight: 600 }}>{req.user?.name || 'Unknown'}</td>
                          <td style={{ padding: '13px 16px', fontWeight: 700, color: '#22c55e' }}>{req.amount || '0'}₮</td>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleApproveRequest(req._id, req.user._id, req.amount)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#15803d', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Зөвшөөрөх</button>
                              <button onClick={() => handleDeleteRequest(req._id)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Татгалзах</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div style={{ textAlign: 'center', padding: '60px 0' }}><FiCreditCard size={48} color="#e2e8f0" style={{ marginBottom: 14 }} /><p style={{ color: '#94a3b8' }}>Ямар нэгэн хүсэлт ирээгүй байна</p></div>}
            </div>
          )}

          {/* CATEGORIES */}
          {activeTab === 'categories' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={s.card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Шинэ ангилал нэмэх</h3>
                {categoryError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 14 }}>{categoryError}</div>}
                {categorySuccess && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 14 }}>{categorySuccess}</div>}
                <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                  {[['Үндсэн ангилал', false], ['Дэд ангилал', true]].map(([label, val]) => {
                    const active = !!parentCategory === val;
                    return <button key={label} onClick={() => { if (val) { const fp = categories.find(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)); if (fp) setParentCategory(fp._id); } else setParentCategory(''); }}
                      style={{ flex: 1, padding: 9, borderRadius: 10, border: active ? '2px solid var(--bn-primary)' : '1.5px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? 'var(--bn-primary)' : '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{label}</button>;
                  })}
                </div>
                {parentCategory && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Үндсэн ангилал сонгох</label>
                    <select value={parentCategory} onChange={(e) => setParentCategory(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}>
                      {categories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)).map(cat => (
                        <option key={cat._id} value={cat._id}>{language === 'MN' ? (cat.titleMn || cat.title) : cat.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder={parentCategory ? 'Дэд ангилалын нэр' : 'Үндсэн ангилалын нэр'} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && document.getElementById('addCategoryBtn').click()}
                    style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  <button id="addCategoryBtn" onClick={async () => {
                    if (!newCategory.trim()) { setCategoryError('Ангилалын нэр оруулна уу'); return; }
                    try {
                      const token = JSON.parse(localStorage.getItem('user'))?.token;
                      const payload = { title: newCategory };
                      if (parentCategory) payload.parent = parentCategory;
                      await axios.post('http://localhost:5000/api/category/', payload, { headers: { Authorization: `Bearer ${token}` } });
                      setNewCategory(''); setCategoryError(null);
                      setCategorySuccess(parentCategory ? 'Дэд ангилал амжилттай үүслээ!' : 'Үндсэн ангилал амжилттай үүслээ!');
                      fetchCategories(); setTimeout(() => setCategorySuccess(null), 3000);
                    } catch (error) { setCategoryError(error.response?.data?.message || 'Ангилал үүсгэхэд алдаа гарлаа'); }
                  }} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--bn-primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Нэмэх</button>
                </div>
              </div>
              <div style={s.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Ангилалын бүтэц</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={s.tag('#eff6ff', '#3b82f6')}>{categories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)).length} үндсэн</span>
                    <span style={s.tag('#f1f5f9', '#475569')}>{categories.filter(c => c.parent && c.parent !== null).length} дэд</span>
                  </div>
                </div>
                {categories.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {categories.filter(c => !c.parent || (typeof c.parent === 'object' && c.parent === null)).map(parentCat => {
                      const subs = categories.filter(c => c.parent && ((typeof c.parent === 'string' && c.parent === parentCat._id) || (typeof c.parent === 'object' && c.parent?._id === parentCat._id)));
                      return (
                        <div key={parentCat._id} style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{language === 'MN' ? (parentCat.titleMn || parentCat.title) : parentCat.title}</span>
                              {subs.length > 0 && <span style={s.tag('#e2e8f0', '#475569')}>{subs.length} дэд</span>}
                            </div>
                            <button onClick={async () => {
                              if (subs.length > 0) { setCategoryError('Дэд ангилал бүхий үндсэн ангилалыг устгах боломжгүй!'); setTimeout(() => setCategoryError(null), 3000); return; }
                              if (window.confirm(`"${parentCat.title}" ангилалыг устгах уу?`)) {
                                try { const token = JSON.parse(localStorage.getItem('user'))?.token; await axios.delete(`http://localhost:5000/api/category/${parentCat._id}`, { headers: { Authorization: `Bearer ${token}` }}); fetchCategories(); setCategorySuccess('Ангилал амжилттай устгагдлаа!'); setTimeout(() => setCategorySuccess(null), 3000); } catch { setCategoryError('Ангилал устгахед алдаа гарлаа'); }
                              }
                            }} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Устгах</button>
                          </div>
                          {subs.length > 0 && <div>{subs.map(subCat => (
                            <div key={subCat._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px 9px 30px', borderTop: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: 13, color: '#64748b' }}>↳ {language === 'MN' ? (subCat.titleMn || subCat.title) : subCat.title}</span>
                              <button onClick={async () => {
                                if (window.confirm(`"${subCat.title}" дэд ангилалыг устгах уу?`)) {
                                  try { const token = JSON.parse(localStorage.getItem('user'))?.token; await axios.delete(`http://localhost:5000/api/category/${subCat._id}`, { headers: { Authorization: `Bearer ${token}` }}); fetchCategories(); setCategorySuccess('Дэд ангилал амжилттай устгагдлаа!'); setTimeout(() => setCategorySuccess(null), 3000); } catch { setCategoryError('Дэд ангилал устгахед алдаа гарлаа'); }
                                }
                              }} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Устгах</button>
                            </div>
                          ))}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Ангилал байхгүй байна</p>}
              </div>
            </div>
          )}

          {/* VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Баталгаажуулалт шалгах</h2>
                {verificationStats && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={s.tag('#fef9c3', '#854d0e')}>{verificationStats.pending} Хүлээгдэж буй</span>
                    <span style={s.tag('#dcfce7', '#15803d')}>{verificationStats.verified} Баталгаажсан</span>
                    <span style={s.tag('#fee2e2', '#dc2626')}>{verificationStats.rejected} Татгалзсан</span>
                  </div>
                )}
              </div>
              {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner-border text-primary" role="status" /></div>
                : pendingVerifications.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {pendingVerifications.map((u) => (
                    <div key={u._id} onClick={() => handleUserClick(u)} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.15s', background: '#fff' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--bn-primary)'; e.currentTarget.style.background = '#eff6ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        {u.photo?.filePath ? <img src={u.photo.filePath} alt="" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser size={22} color="#94a3b8" /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                          <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FiClock size={12} color="#94a3b8" />
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(u.identityVerification?.requestedAt).toLocaleDateString('mn-MN')}</span>
                        </div>
                        <span style={s.tag('#fef9c3', '#854d0e')}>Хүлээгдэж буй</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}><BsCheckCircleFill size={48} color="#e2e8f0" style={{ marginBottom: 14 }} /><p style={{ color: '#94a3b8' }}>Хүлээгдэж буй баталгаажуулалт байхгүй байна</p></div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820 }}>
              {[
                { title: 'Харагдац', Icon: FiSun, content: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: 12 }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 8 }}>{isDarkMode ? <FiMoon size={16} /> : <FiSun size={16} />} {t('darkMode') || 'Харанхуй горим'}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Интерфейсийн өнгийн тохиргоо</p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer', flexShrink: 0 }}>
                      <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', inset: 0, background: isDarkMode ? 'var(--bn-primary)' : '#d1d5db', borderRadius: 26, transition: '0.3s' }} />
                      <span style={{ position: 'absolute', top: 3, left: isDarkMode ? 25 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </label>
                  </div>
                )},
                { title: 'Платформын тохиргоо', Icon: FiSettings, content: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[['Сайтын нэр', 'text', 'Auction Platform'], ['Холбоо барих имэйл', 'email', 'admin@auction.mn'], ['Холбоо барих утас', 'tel', '+976 7000-0000']].map(([label, type, def]) => (
                      <div key={label}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
                      <input type={type} defaultValue={def} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} /></div>
                    ))}
                    <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Цагийн бүс</label>
                    <select defaultValue="Asia/Ulaanbaatar" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar (UTC+8)</option><option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    </select></div>
                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: '#f8fafc', borderRadius: 12 }}>
                      <input type="checkbox" id="maintenanceMode" style={{ marginTop: 2, accentColor: 'var(--bn-primary)', width: 16, height: 16 }} />
                      <div><label htmlFor="maintenanceMode" style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Засвар үйлчилгээний горим</label>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>Идэвхжүүлбэл зөвхөн админ нэвтрэх боломжтой</p></div>
                    </div>
                  </div>
                )},
                { title: 'Төлбөр, хураамж', Icon: FiCreditCard, content: (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[['Борлуулалтын комисс (%)', 'number', '5', 'Бараа зарагдах үед суутгах хувь'], ['Бүртгэлийн хураамж (₮)', 'number', '0', 'Шинэ бараа оруулахад төлөх'], ['Баталгаажуулалтын хураамж (₮)', 'number', '5000', 'Хэрэглэгч баталгаажуулах үйлчилгээ'],
                      ['Хамгийн бага зарах үнэ (₮)', 'number', '1000', ''], ['Хамгийн их зарах үнэ (₮)', 'number', '100000000', '']].map(([label, type, def, hint]) => (
                      <div key={label}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
                      <input type={type} defaultValue={def} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      {hint && <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{hint}</p>}</div>
                    ))}
                  </div>
                )},
                { title: 'Аюулгүй байдал', Icon: FiSettings, content: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[['Нэвтрэх оролдлогын лимит', '5', 'Буруу нэвтрэх оролдлогын тоо'], ['Хаалтын хугацаа (минут)', '30', 'Лимит давсны дараа хааж байх хугацаа'], ['Session timeout (минут)', '60', 'Автоматаар гарах хугацаа']].map(([label, def, hint]) => (
                      <div key={label}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
                      <input type="number" defaultValue={def} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{hint}</p></div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', background: '#f8fafc', borderRadius: 12 }}>
                      <input type="checkbox" id="require2FA" style={{ marginTop: 2, accentColor: 'var(--bn-primary)', width: 16, height: 16 }} />
                      <div><label htmlFor="require2FA" style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>2-Factor Authentication</label>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>Админд нэвтрэх үед SMS баталгаажуулалт</p></div>
                    </div>
                  </div>
                )},
                { title: 'Мэдэгдэл, имэйл', Icon: FiUser, content: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['emailNewUser', 'Шинэ хэрэглэгч бүртгүүлэх үед имэйл илгээх'], ['emailVerificationApproved', 'Баталгаажуулалт зөвшөөрөгдөх үед имэйл илгээх'], ['emailAuctionWon', 'Дуудлага худалдаа ялах үед имэйл илгээх'], ['emailOutbid', 'Санал хүчингүй болох үед имэйл илгээх']].map(([id, label]) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
                        <input type="checkbox" id={id} defaultChecked style={{ accentColor: 'var(--bn-primary)', width: 16, height: 16, flexShrink: 0 }} />
                        <label htmlFor={id} style={{ fontSize: 13, cursor: 'pointer' }}>{label}</label>
                      </div>
                    ))}
                  </div>
                )},
              ].map(({ title, Icon, content }) => (
                <div key={title} style={s.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color="var(--bn-primary)" /></div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
                  </div>
                  {content}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button style={s.btn('#f8fafc', '#64748b', '1.5px solid #e2e8f0')}>Буцаах</button>
                <button style={s.btn('var(--bn-primary)', '#fff')}>Хадгалах</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
export default Admin;
