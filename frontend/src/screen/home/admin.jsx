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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [categorySuccess, setCategorySuccess] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');


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

  const [activeTab, setActiveTab] = useState('myProducts'); 
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
n// Handle parent category change
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
   
         <div className="container mt-n5">
           <div className="row">
             <div className="col-md-3">
               <div className="card shadow-sm border-0 mb-4">
                 <div className="card-body p-0">
                   <ul className="nav flex-column">
                     <li className="nav-item">
                       <button 
                         className={`nav-link d-flex align-items-center ${activeTab === 'myProducts' ? 'active' : ''}`}
                         onClick={() => setActiveTab('myProducts')}
                       >
                         <FiShoppingBag className="me-2" />
                         Миний бараанууд
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                     <li className="nav-item">
                       <button 
                         className={`nav-link d-flex align-items-center ${activeTab === 'addProduct' ? 'active' : ''}`}
                         onClick={() => setActiveTab('addProduct')}
                       >
                         <FiPlusCircle className="me-2" />
                         Шинэ бараа нэмэх
                         <BsArrowRightShort className="ms-auto" />
                       </button>
                     </li>
                     <li className="nav-item">
                       <button 
                         className={`nav-link d-flex align-items-center ${activeTab === 'history' ? 'active' : ''}`}
                         onClick={() => setActiveTab('users')}
                       >
                         <FiClock className="me-2" />
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
                         className={`nav-link d-flex align-items-center ${activeTab === 'requests' ? 'active' : ''}`}
                         onClick={() => setActiveTab('requests')}
                       >
                         <FiPlusCircle className="me-2" />
                         Ирсэн хүсэлтүүд
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
               {activeTab === 'addProduct' && (
                 <div className="card shadow-sm border-0 mb-4">
                   <div className="card-body p-4">
                     <div className="d-flex justify-content-between align-items-center mb-4">
                       <h4 className="mb-0">
                         <FiPlusCircle className="me-2" />
                         Шинэ бараа нэмэх
                       </h4>
                       <button 
                         className="btn btn-sm btn-outline-secondary"
                         onClick={() => setActiveTab('myProducts')}
                       >
                         Миний бараанууд руу буцах
                       </button>
                     </div>
   
                     <form onSubmit={handleSubmit} encType="multipart/form-data">
                       <div className="row g-3">
                         <div className="col-12">
                           <h5 className="section-title mb-3 text-primary">
                             <span className="bg-primary bg-opacity-10 px-3 py-1 rounded">Үндсэн мэдээлэл</span>
                           </h5>
                         </div>
                         
                         {['title', 'description', 'price'].map(field => (
                           <div className="col-md-6" key={field}>
                             <div className="form-floating">
                               {field === 'description' ? (
                                 <textarea
                                   className="form-control"
                                   id={field}
                                   name={field}
                                   value={formData[field]}
                                   onChange={handleChange}
                                   required
                                   rows={5}
                                   placeholder=" "
                                   style={{ height: '120px' }}
                                 />
                               ) : (
                                 <input
                                   type={field === 'price' ? 'number' : 'text'}
                                   className="form-control"
                                   id={field}
                                   name={field}
                                   value={formData[field]}
                                   onChange={handleChange}
                                   required
                                   min={field === 'price' ? 1 : undefined}
                                   placeholder=" "
                                 />
                               )}
                               <label htmlFor={field}>
                                 {field === 'title' ? 'Барааны нэр*' : 
                                 field === 'description' ? 'Тайлбар*' : 'Үндсэн үнэ*'}
                               </label>
                             </div>
                           </div>
                         ))}
   
                         <div className="col-12 mt-3">
                           <h5 className="section-title mb-3 text-primary">
                             <span className="bg-primary bg-opacity-10 px-3 py-1 rounded">Нэмэлт мэдээлэл</span>
                           </h5>
                         </div>
   
                         {/* Parent Category */}
                         <div className="col-md-6">
                           <div className="form-floating">
                             <select
                               className="form-select"
                               id="parentCategory"
                               value={parentCategory}
                               onChange={handleParentCategoryChange}
                               required
                             >
                               <option value="">Үндсэн ангилал сонгох</option>
                               {categories
                                 .filter(cat => !cat.parent || (typeof cat.parent === 'object' && cat.parent === null))
                                 .map((parentCat) => (
                                   <option key={parentCat._id} value={parentCat._id}>
                                     {language === 'MN' ? (parentCat.titleMn || parentCat.title) : parentCat.title}
                                   </option>
                                 ))}
                             </select>
                             <label htmlFor="parentCategory">Үндсэн ангилал*</label>
                           </div>
                         </div>

                         {/* Subcategory */}
                         <div className="col-md-6">
                           <div className="form-floating">
                             <select
                               className="form-select"
                               id="category"
                               name="category"
                               value={formData.category}
                               onChange={handleChange}
                               required
                               disabled={!parentCategory || subcategories.length === 0}
                             >
                               <option value="">Дэд ангилал сонгох</option>
                               {subcategories.map((subCat) => (
                                 <option key={subCat._id} value={subCat._id}>
                                   {language === 'MN' ? (subCat.titleMn || subCat.title) : subCat.title}
                                 </option>
                               ))}
                             </select>
                             <label htmlFor="category">Дэд ангилал*</label>
                             {parentCategory && subcategories.length === 0 && (
                               <small className="text-muted">
                                 Дэд ангилал байхгүй байна
                               </small>
                             )}
                           </div>
                         </div>
   
                         {['height', 'length', 'width', 'weight'].map(field => (
                           <div className="col-md-6" key={field}>
                             <div className="form-floating">
                               <input
                                 type="number"
                                 className="form-control"
                                 id={field}
                                 name={field}
                                 value={formData[field]}
                                 onChange={handleChange}
                                 placeholder=" "
                                 min={0}
                               />
                               <label htmlFor={field}>
                                 {field === 'height' ? 'Өндөр (см)' :
                                 field === 'length' ? 'Урт (см)' :
                                 field === 'width' ? 'Өргөн (см)' : 'Жин (кг)'}
                               </label>
                             </div>
                           </div>
                         ))}
   
                         <div className="col-12 mt-3">
                           <h5 className="section-title mb-3 text-primary">
                             <span className="bg-primary bg-opacity-10 px-3 py-1 rounded">Дуудлага худалдааны тохиргоо</span>
                           </h5>
                         </div>
                         
                         <div className="col-md-6">
                           <div className="form-floating">
                             <input
                               type="number"
                               className="form-control"
                               id="bidThreshold"
                               name="bidThreshold"
                               value={formData.bidThreshold}
                               onChange={handleChange}
                               min="0"
                               placeholder=" "
                             />
                             <label htmlFor="bidThreshold">Хамгийн бага үнэ</label>
                           </div>
                         </div>
   
                         <div className="col-md-6">
                           <div className="form-floating">
                             <input
                               type="datetime-local"
                               className="form-control"
                               id="bidDeadline"
                               name="bidDeadline"
                               value={formData.bidDeadline}
                               onChange={handleChange}
                               required
                               min={new Date().toISOString().slice(0, 16)}
                               placeholder=" "
                             />
                             <label htmlFor="bidDeadline">Дуусах хугацаа*</label>
                           </div>
                         </div>
   
                          <div className="col-12">
  <div className="image-upload-container border rounded p-4">
    <label htmlFor="imageUpload" className="upload-label">
      <div className="upload-content">
        <div className="upload-icon mb-3">
          <i className="bi bi-cloud-arrow-up fs-1 text-muted"></i>
        </div>
        <h6>Зураг оруулах</h6>
        <p className="text-muted mb-0">JPG, PNG форматаар (5MB хүртэл)</p>
        <p className="text-muted small">Хамгийн багадаа 1 зураг оруулна уу</p>
      </div>
      <input
        type="file"
        id="imageUpload"
        className="d-none"
        name="images"
        onChange={handleChange}
        accept="image/*"
        multiple // Allow multiple file selection
      />
    </label>
    
    {/* Image previews */}
    {formData.images.length > 0 && (
      <div className="mt-3">
        <h6 className="mb-2">Оруулсан зурагнууд:</h6>
        <div className="d-flex flex-wrap gap-2">
          {formData.images.map((image, index) => (
            <div key={index} className="position-relative" style={{ width: '100px' }}>
              <img 
                src={image.preview} 
                alt={`Preview ${index}`}
                className="img-thumbnail"
                style={{ height: '100px', objectFit: 'cover' }}
              />
              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                onClick={() => removeImage(index)}
                style={{ transform: 'translate(50%, -50%)' }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</div>

                      <div className="col-12 mt-4">
                        <button 
                          type="submit" 
                          className="btn btn-primary py-3 w-100"
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Хадгалж байна...
                            </>
                          ) : (
                            'Бараа нэмэх'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
   
               {activeTab === 'myProducts' && (
                 <div className="card shadow-sm border-0 mb-4">
                   <div className="card-body">
                     <div className="d-flex justify-content-between align-items-center mb-4">
                       <h4 className="mb-0">
                         <FiShoppingBag className="me-2" />
                         Миний бараанууд
                       </h4>
                       <div className="d-flex align-items-center">
                         <div className="input-group me-3" style={{ width: '250px' }}>
                           <input 
                             type="text" 
                             className="form-control" 
                             placeholder="Хайх..." 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                           />
                           <button 
                             className="btn btn-outline-secondary" 
                             type="button" 
                             onClick={handleSearch}
                             disabled={loading}
                           >
                             <FiSearch />
                           </button>
                         </div>
                         <span className="badge bg-primary rounded-pill">{products.length}</span>
                       </div>
                     </div>
   
                     {loading ? (
                       <div className="text-center py-5">
                         <div className="spinner-border text-primary" role="status">
                           <span className="visually-hidden">Ачаалж байна...</span>
                         </div>
                         <p className="mt-3">Бараануудыг ачаалж байна...</p>
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
                     ) : products.length > 0 ? (
                       <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                         {products.map((product) => (
                           <div className="col" key={product._id}>
                             <div className="card h-100 product-card">
                               {product.images && (
                                 <img 
                                   src={product.image} 
                                   className="card-img-top product-image" 
                                   alt={product.title}
                                   onClick={() => navigate(`/products/${product._id}`)}
                                 />
                               )}
                               <div className="card-body">
                                 <h5 className="card-title">{product.title}</h5>
                                 <div className="d-flex justify-content-between align-items-center mb-2">
                                   <span className="fw-bold text-primary">{product.currentBid}₮</span>
                                   <span className={`badge ${product.sold ? 'bg-success' : 'bg-secondary'}`}>
                                     {product.sold ? 'Зарагдсан' : 'Зарагдаагүй'}
                                   </span>
                                 </div>
                                 <div className="d-flex justify-content-between">
                                   <button 
                                     className="btn btn-sm btn-outline-primary"
                                     onClick={() => navigate(`/products/${product._id}`)}
                                   >
                                     Дэлгэрэнгүй
                                   </button>
                                   {!product.sold && (
                                     <button 
                                       className="btn btn-sm btn-primary"
                                       onClick={() => handleSellProduct(product._id, product.currentBid)}
                                     >
                                       Зарах
                                     </button>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-5">
                         <div className="empty-state">
                           <img 
                             src="/empty-box.svg" 
                             alt="No products" 
                             className="img-fluid mb-4"
                             style={{ maxWidth: '200px', opacity: 0.7 }}
                           />
                           <h5 className="text-muted">
                             {searchTerm 
                               ? `"${searchTerm}" гэсэн үр дүн олдсонгүй` 
                               : 'Одоогоор бараа байхгүй байна'}
                           </h5>
                           {!searchTerm && (
                             <button 
                               className="btn btn-primary mt-3"
                               onClick={() => setActiveTab('addProduct')}
                             >
                               <FiPlusCircle className="me-2" />
                               Шинэ бараа нэмэх
                             </button>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}
   
                {activeTab === 'users' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="card-title mb-0">Хэрэглэгчид</h4>
        <span className="badge bg-secondary">{users.length} Хэрэглэгчид</span>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Хэрэглэгчийн нэр, имэйл эсвэл нэрээр хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={handleSearch}
            >
              Хайх
            </button>
          </div>
        </div>
        
      </div>

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
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {users.map((user) => (
            <div className="col" key={user._id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{user.name}</h5>
                  <p className="card-text text-truncate">{user.email}</p>
                  <p className="card-text">
                    Үлдэгдэл: {user.balance?.toFixed(2) || '0.00'}₮
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBalanceClick(user._id);
                        }}
                      >
                        Данс цэнэглэх
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchUserProducts(user._id);
                        }}
                      >
                        Бараануудыг үзэх
                      </button>
                    </div>
                    <span className={`badge ${
                      user.role === 'admin' ? 'bg-danger' : 
                      user.role === 'moderator' ? 'bg-warning' : 'bg-primary'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Хэрэглэгч олдсонгүй</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
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
        <h4 className="card-title mb-0">Ирсэн хүсэлтүүд</h4>
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
        <span className="badge bg-secondary">{categories.length} ангилал</span>
      </div>

      {categoryError && (
        <div className="alert alert-danger">{categoryError}</div>
      )}
      
      {categorySuccess && (
        <div className="alert alert-success">{categorySuccess}</div>
      )}

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Шинэ ангилал нэмэх</h5>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ангилалын нэр"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button 
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!newCategory.trim()) {
                      setCategoryError('Ангилалын нэр оруулна уу');
                      return;
                    }
                    
                    try {
                      const token = JSON.parse(localStorage.getItem('user'))?.token;
                      await axios.post(
                        'http://localhost:5000/api/category/',
                        { title: newCategory },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        }
                      );
                      
                      setNewCategory('');
                      setCategoryError(null);
                      setCategorySuccess('Ангилал амжилттай үүслээ!');
                      fetchCategories();
                      
                      // Clear success message after 3 seconds
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

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Ангилалууд</h5>
              
              {loading ? (
                <div className="text-center py-2">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : categories.length > 0 ? (
                <div className="list-group">
                  {categories.map((category) => (
                    <div 
                      key={category._id} 
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {category.title}
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={async () => {
                          if (window.confirm(`Та "${category.title}" ангилалыг устгахдаа итгэлтэй байна уу?`)) {
                            try {
                              const token = JSON.parse(localStorage.getItem('user'))?.token;
                              await axios.delete(
                                `http://localhost:5000/api/category/${category._id}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`
                                  }
                                }
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
                  ))}
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

{activeTab === 'settings' && (
  <div className="card border-0 shadow-sm">
    <div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FiSettings className="me-2" />
          {t('settings') || 'Тохиргоо'}
        </h4>
      </div>

      <div className="settings-section">
        <h5 className="mb-3 text-primary">{t('appearance') || 'Харагдац'}</h5>

        <div className="card bg-light border-0 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0">
                {isDarkMode ? <FiMoon className="me-2" /> : <FiSun className="me-2" />}
                {t('darkMode') || 'Харанхуй горим'}
              </h6>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="darkModeSwitch"
                checked={isDarkMode}
                onChange={toggleTheme}
                style={{
                  width: '3em',
                  height: '1.5em',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}


             </div>
           </div>
         </div></div>
         )}
export default Admin;
