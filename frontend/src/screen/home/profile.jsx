import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiShoppingBag, FiPlusCircle, FiClock, FiCreditCard, FiSettings,FiCamera, FiRefreshCw, FiSearch, FiMoon, FiSun} from 'react-icons/fi';
import { BsArrowRightShort, BsCheckCircleFill } from 'react-icons/bs';
import "../../index.css";
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { buildApiUrl } from '../../config/api';

export const Profile = () => {
  const toast = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false); 
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState(null);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('myProducts');
  const [qpayInvoice, setQpayInvoice] = useState({
  urls: [],
  qr_image: ''
});

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

  const navigate = useNavigate();

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
  
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
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
          ? buildApiUrl(`/api/product/my?search=${debouncedSearchTerm}`)
          : buildApiUrl('/api/product/my');

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

  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm);
  };
  const handleRecharge = async (e) => {
  e.preventDefault();
  setRechargeError(null);
  setRechargeSuccess(false);
  setRechargeLoading(true);

  try {
    const response = await axios.post(
      buildApiUrl('/api/request/'),
      { amount: rechargeAmount },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    setQpayInvoice(response.data);
    setRechargeLoading(false);
  } catch (error) {
    setRechargeError(error.response?.data?.message || 'Төлбөрийн системд алдаа гарлаа');
    setRechargeLoading(false);
  }
};
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
        buildApiUrl('/api/bidding/sell'),
        { productId, price: currentBid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data.sold) {
        toast.success(`Бараа амжилттай зарагдлаа! Гүйлгээний дугаар: ${response.data.transactionId}`);
        const productsResponse = await axios.get(buildApiUrl('/api/product/my'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Sell product error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Бараа зарах явцад алдаа гарлаа';
      toast.error(errorMessage);
    }
  };
const handleChange = (e) => {
  const { name, value, files } = e.target;
  
  if (name === 'images') {
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 
      );
      
      if (validFiles.length !== files.length) {
        toast.warning('Зөвхөн зураг файл (JPG, PNG) оруулна уу. Файлын хэмжээ 5MB-аас ихгүй байх ёстой.');
      }
      
      const imagePreviews = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imagePreviews]
      }));
    }
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
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
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Та энэ барааг устгахдаа итгэлтэй байна уу?')) {
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const response = await axios.delete(
          buildApiUrl(`/api/product/${productId}`),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
  
        setProducts(products.filter(product => product._id !== productId));
        toast.success('Бараа амжилттай устгагдлаа');
      } catch (error) {
        console.error('Delete product error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Устгахад алдаа гарлаа';
        toast.error(errorMessage);
      }
    }
  };


  useEffect(() => {
    const fetchTransactions = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        return;
      }
  
      try {
        const parsedUser = JSON.parse(userData);
        const token = parsedUser.token;
        
        if (!token) {
          navigate('/login');
          return;
        }
  
        const response = await axios.get(buildApiUrl('/api/transaction/my'), {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        });
        setTransactions(response.data);
      } catch (error) {
        console.error('Transaction fetch error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('user');
          navigate('/login');
        }
      }
    };
  
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const response = await axios.get(buildApiUrl('/api/category/'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
  
    if (activeTab === 'addProduct') {
      fetchCategories();
    }
  }, [activeTab]);

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
    
    // Add all form fields except images
    Object.keys(formData).forEach(key => {
      if (key !== 'images' && formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
        // Convert numbers to strings for FormData
        const value = typeof formData[key] === 'number' ? formData[key].toString() : formData[key];
        formDataToSend.append(key, value);
      }
    });
    
    // Ensure category is always set (default to empty string if not provided)
    if (!formData.category || formData.category === '') {
      formDataToSend.append('category', 'General');
    }
    
    formData.images.forEach((imageObj, index) => {
      formDataToSend.append(`images`, imageObj.file); 
    });
    
    const response = await axios.post(
      buildApiUrl('/api/product/'), 
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
    
    // Refresh products list
    const productsResponse = await axios.get(buildApiUrl('/api/product/my'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProducts(productsResponse.data);
    
    // Switch back to products tab
    setActiveTab('myProducts');

  } catch (error) {
    console.error('Error submitting:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Алдаа гарлаа. Дахин оролдоно уу?';
    toast.error(errorMessage);
  } finally {
    setUploading(false);
  }
};
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const token = getAuthToken();
      
      const formData = new FormData();
      formData.append('photo', file);
  
      const response = await axios.put(buildApiUrl('/api/users/photo'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
  
    
      setUser(prev => ({ ...prev, photo: response.data.photo }));

      toast.success('Профайл зураг амжилттай шинэчлэгдлээ!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Зураг шинэчлэхэд алдаа гарлаа!'); 
    }
  };

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <div className="card shadow-sm border-0 p-5">
          <h2 className="mb-4">Нэвтрэх шаардлагатай</h2>
          <p className="mb-4 text-muted">Профайл харахын тулд нэвтрэнэ үү</p>
          <a href="/login" className="btn btn-primary px-4 py-2">
            Нэвтрэх
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="profile-header bg-gradient-primary text-white py-4">
  <div className="container">
    <div className="d-flex align-items-center">
      <div className="profile-avatar me-4 position-relative">
        <div className="avatar-circle" style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={user.photo?.filePath || '/default.png'} 
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        
        <label 
          htmlFor="profile-photo-upload"
          className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 cursor-pointer"
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid white'
          }}
          title="Зураг солих"
        >
          <FiCamera className="text-white" />
          <input 
            type="file" 
            id="profile-photo-upload" 
            className="d-none" 
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </label>
      </div>
      
      <div>
        <h2 className="mb-1">{user.name}</h2>
        <p className="mb-2">{user.email}</p>
        <div className="d-flex align-items-center">
          <span className="badge bg-white text-primary fs-6 px-3 py-2 me-3">
            {user.balance?.toFixed(2) || '0.00'}₮
          </span>
          <button 
            className="btn btn-sm btn-outline-light"
            onClick={() => setActiveTab('')}
          >
            Данс цэнэглэх
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

      <div className="container mt-n5">
        <div className="row">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-0">
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <button 
                      type="button"
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
                      type="button"
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
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === 'history' ? 'active' : ''}`}
                      onClick={() => setActiveTab('history')}
                    >
                      <FiClock className="me-2" />
                      Гүйлгээний түүх
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === '' ? 'active' : ''}`}
                      onClick={() => setActiveTab('')}
                    >
                      <FiCreditCard className="me-2" />
                      Данс цэнэглэх
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <FiUser className="me-2" />
                      Профайл
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === 'settings' ? 'active' : ''}`}
                      onClick={() => setActiveTab('settings')}
                    >
                      <FiSettings className="me-2" />
                      Тохиргоо
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h6 className="card-title text-muted mb-3">Миний мэдээлэл</h6>
                <div className="stat-item d-flex justify-content-between mb-2">
                  <span>Бараа</span>
                  <span className="fw-bold">{products.length}</span>
                </div>
                <div className="stat-item d-flex justify-content-between mb-2">
                  <span>Гүйлгээ</span>
                  <span className="fw-bold">{transactions.length}</span>
                </div>
                <div className="stat-item d-flex justify-content-between">
                  <span>Үлдэгдэл</span>
                  <span className="fw-bold">{user.balance?.toFixed(2) || '0.00'}₮</span>
                </div>
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

                      <div className="col-md-6">
                        <div className="form-floating">
                          <select
                            className="form-select"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Ангилал сонгох</option>
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.title}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="category">Ангилал*</label>
                        </div>
                      </div>


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
                          <label htmlFor="bidThreshold">Таны хүссэн үнэ</label>
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
                {product.image && (
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
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <button 
                      className="btn btn-sm btn-outline-primary flex-grow-1"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      Дэлгэрэнгүй
                    </button>
                    {!product.sold && (
                      <button 
                        className="btn btn-sm btn-primary flex-grow-1"
                        onClick={() => handleSellProduct(product._id, product.currentBid)}
                      >
                        Зарах
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline-warning flex-grow-1"
                      onClick={() => navigate(`/edit-product/${product._id}`)}
                    >
                      Засах
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger flex-grow-1"
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      Устгах
                    </button>
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
            {activeTab === 'history' && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                      <FiClock className="me-2" />
                      Гүйлгээний түүх
                    </h4>
                    <span className="badge bg-primary rounded-pill">{transactions.length}</span>
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Уншиж байна...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="empty-state">
                        <img 
                          src="/empty-history.svg" 
                          alt="No transactions" 
                          className="img-fluid mb-4"
                          style={{ maxWidth: '200px', opacity: 0.7 }}
                        />
                        <h5 className="text-muted">Гүйлгээний түүх хоосон байна</h5>
                        <p className="text-muted">Таны хийсэн гүйлгээ энд харагдана</p>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Бараа</th>
                            <th>Үнэ</th>
                            <th>Худалдагч</th>
                            <th>Огноо</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction._id} className="cursor-pointer">
                              <td>
                                <div className="d-flex align-items-center">
                                  {transaction.product?.image && (
                                    <img 
                                      src={transaction.product.image} 
                                      alt={transaction.product.title}
                                      className="rounded me-3"
                                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                  )}
                                  <div>
                                    <strong>{transaction.product?.title || 'Unknown Product'}</strong>
                                    <div className="text-muted small">{transaction.product?.category}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="fw-bold text-primary">{transaction.amount}₮</td>
                              <td>{transaction.seller?.name || 'Unknown Seller'}</td>
                             
                              <td className="text-muted small">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                                <br />
                                {new Date(transaction.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
{activeTab === '' && (
  <div className="card shadow-sm border-0 mb-4">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FiCreditCard className="me-2" />
          Данс цэнэглэх
        </h4>
        <span className="badge bg-primary rounded-pill">
          {user.balance?.toFixed(2) || '0.00'}₮
        </span>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <form onSubmit={handleRecharge}>
            <div className="mb-3">
              <label className="form-label">Цэнэглэх дүн (₮)</label>
              <div className="input-group">
                <span className="input-group-text bg-primary text-white">₮</span>
                <input
                  type="number"
                  className="form-control"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  min="1000"
                  step="1000"
                  required
                  placeholder="1000, 5000, 10000..."
                />
              </div>
              <div className="form-text">Хамгийн бага дүн: 1,000₮</div>
            </div>

            {rechargeError && (
              <div className="alert alert-danger">{rechargeError}</div>
            )}

            {rechargeSuccess && (
              <div className="alert alert-success">
                Амжилттай цэнэглэгдлээ! Таны шинэ үлдэгдэл: {user.balance?.toFixed(2)}₮
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3"
              disabled={rechargeLoading}
            >
              {rechargeLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Цэнэглэж байна...
                </>
              ) : (
                'QPay-р данс цэнэглэх'
              )}
            </button>
          </form>
        </div>

        <div className="col-md-6">
         {qpayInvoice && (
  <div className="card bg-light border-0 mb-3">
    <div className="card-body text-center">
      <h5 className="card-title mb-3">QPay</h5>
      
      {qpayInvoice.payment?.qr_image && (
        <div className="mb-3">
          <img 
            src={`data:image/png;base64,${qpayInvoice.payment.qr_image}`} 
            alt="QPay QR Code" 
            className="img-fluid mb-2"
            style={{ maxWidth: '200px' }}
          />
          <p className="text-muted small">QR кодыг уншуулна уу</p>
        </div>
      )}
      
      
    </div>
  </div>
)}
          {!qpayInvoice && (
            <div className="card bg-light border-0">
              <div className="card-body text-center">
                <img 
                  src="/qpay-logo.png" 
                  alt="QPay" 
                  style={{ height: '40px', marginBottom: '15px' }}
                />
                <h5 className="card-title text-muted mb-3">QPay төлбөрийн систем</h5>
                <p className="text-muted small">
                  Дээрх дүнг оруулаад "QPay-р данс цэнэглэх" товчийг дарна уу
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
            {activeTab === 'profile' && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                      <FiUser className="me-2" />
                      Миний профайл
                    </h4>
                    <button className="btn btn-sm btn-outline-primary">
                      <FiSettings className="me-1" />
                      Тохиргоо
                    </button>
                  </div>

                  <div className="row">

                    <div className="col-md-4">
                      <div className="profile-info-card p-4 rounded bg-light mb-4 h-100">
                        <h5 className="mb-4 text-primary">Үндсэн мэдээлэл</h5>
                        <div className="mb-3">
                          <label className="form-label text-muted">Нэр</label>
                          <div className="form-control bg-white">{user.name || ''}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted">Имэйл</label>
                          <div className="form-control bg-white">{user.email || ''}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted">Утасны дугаар</label>
                          <div className="form-control bg-white">{user.phone || 'Бүртгэгдээгүй'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="profile-stats-card p-4 rounded bg-light h-100">
                        <h5 className="mb-4 text-primary">Статистик</h5>
                        <div className="stat-item d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded">
                          <div>
                            <FiShoppingBag className="me-2 text-primary" />
                            <span>Миний бараа</span>
                          </div>
                          <span className="badge bg-primary rounded-pill">{products.length}</span>
                        </div>
                        <div className="stat-item d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded">
                          <div>
                            <FiClock className="me-2 text-primary" />
                            <span>Гүйлгээний түүх</span>
                          </div>
                          <span className="badge bg-primary rounded-pill">{transactions.length}</span>
                        </div>
                        <div className="stat-item d-flex justify-content-between align-items-center p-3 bg-white rounded">
                          <div>
                            <FiCreditCard className="me-2 text-primary" />
                            <span>Үлдэгдэл</span>
                          </div>
                          <span className="fw-bold text-primary">{user.balance?.toFixed(2) || '0.00'}₮</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                      <FiSettings className="me-2" />
                      Тохиргоо
                    </h4>
                  </div>

                  <div className="settings-section">
                    <h5 className="mb-3 text-primary">Харагдах байдал</h5>

                    <div className="card bg-light border-0 p-4 mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            {isDarkMode ? <FiMoon className="me-2" /> : <FiSun className="me-2" />}
                            Харанхуй горим
                          </h6>
                          <p className="text-muted small mb-0">
                            Нүдэнд ээлтэй харанхуй дэлгэц
                          </p>
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

                    <div className="alert alert-info">
                      <strong>💡 Зөвлөмж:</strong> Харанхуй горимыг ашиглавал нүд хамгийн бага ядарна.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div></div>
      )}

  