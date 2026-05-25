import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiShoppingBag, FiPlusCircle, FiClock, FiCreditCard, FiSettings, FiCamera, FiRefreshCw, FiSearch, FiMoon, FiSun, FiTrendingUp, FiBarChart2, FiFileText, FiChevronDown } from 'react-icons/fi';
import { BsArrowRightShort, BsCheckCircleFill } from 'react-icons/bs';
import "../../index.css";
import "./ProfileForm.css";
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { buildApiUrl } from '../../config/api';
import { MyBidsPanel } from '../../components/bidding/MyBidsPanel';
import { SellerDashboard } from '../../components/selling/SellerDashboard';
import { useAutosave } from '../../hooks/useAutosave';
import { useDraft } from '../../context/DraftContext';
import DraftStatusIndicator from '../../components/DraftStatusIndicator';
import ImageUploader from '../../components/design-system/ImageUploader';
// CategorySuggester removed - using manual category selection only

const MAX_IMAGE_UPLOADS = 20;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_IMAGE_LIMIT_MESSAGE = 'You can upload up to 20 images (5MB max each).';
const DESCRIPTION_TEMPLATE = [
  'Condition:',
  'Brand:',
  'Model:',
  'Size:',
  'Color:',
  'Accessories:',
  'Notes:'
].join('\n');

export const Profile = () => {
  const toast = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
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
  const [parentCategory, setParentCategory] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('myProducts');
  const [categoryPickerTab, setCategoryPickerTab] = useState('list');
  const [categoryKeyword, setCategoryKeyword] = useState('');
  const [qpayInvoice, setQpayInvoice] = useState({
  urls: [],
  qr_image: ''
});

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [extendModal, setExtendModal] = useState(null); // { product, days }
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    startingBid: '',
    sellType: 'auction',
    category: '',
    // General fields
    height: '',
    length: '',
    width: '',
    weight: '',
    bidThreshold: '',
    bidDeadline: '',
    images: [],
    // Yahoo Auctions-style start system
    startMode: 'immediate', // 'immediate' or 'scheduled'
    scheduledDate: '',      // Date for scheduled start (YYYY-MM-DD)
    scheduledTime: '',      // Time for scheduled start (HH:MM)
    duration: '7',           // Auction duration in days
    endTime: '',           // Legacy field (kept for compatibility)
    // Automotive-specific fields
    manufacturer: '',
    model: '',
    year: '',
    mileage: '',
    engineSize: '',
    fuelType: '',
    transmission: '',
    color: '',
    condition: '',
    shippingOrigin: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { tab: tabParam } = useParams();

  // Draft auto-save hooks
  const { getDraft, deleteDraft, saveToLocalStorage, listDrafts, drafts } = useDraft();
  const draftKey = editingProductId ? `editProduct-${editingProductId}` : 'addProduct';

  const draftPayload = useMemo(
    () => ({
      ...formData,
      _draftMeta: {
        parentCategory,
        categoryPickerTab,
        categoryKeyword,
      },
    }),
    [formData, parentCategory, categoryPickerTab, categoryKeyword]
  );
  const draftItems = useMemo(() => {
    const items = listDrafts();
    return items
      .filter((item) => /-\d{13}$/.test(item.key))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [listDrafts, drafts]);
  const previousDrafts = useMemo(
    () => draftItems.filter((item) => item.key !== draftKey),
    [draftItems, draftKey]
  );

  // Auto-save form data (only when in addProduct tab)
  useAutosave(
    draftKey,
    activeTab === 'addProduct' ? draftPayload : null,
    2000 // 2 second debounce
  );

  // Drafts are resumed manually from the Drafts list.

  // Initialize tab from route param (/profile/tab/:tab) or fallback query (?tab=addProduct)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromQuery = params.get('tab');
    const nextTab = tabParam || tabFromQuery || 'myProducts';
    setActiveTab(nextTab);
  }, [location.search, tabParam]);

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Та аккаунтаа бүрмөсөн устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.');
    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      await axios.delete(buildApiUrl('/api/users/me'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        withCredentials: true
      });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast.success('Аккаунт амжилттай устгагдлаа.');
      navigate('/', { replace: true });
      window.location.reload();
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error.response?.data?.message || 'Аккаунтыг устгах боломжгүй байна.');
    } finally {
      setIsDeletingAccount(false);
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
        setError(err.message || 'Бүтээгдэхүүн ачаалахад алдаа гарлаа. Дахин оролдоно уу.');
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

  const handleInsertDescriptionTemplate = () => {
    setFormData((prev) => {
      const current = (prev.description || '').trim();
      const next = current ? `${current}\n\n${DESCRIPTION_TEMPLATE}` : DESCRIPTION_TEMPLATE;
      return { ...prev, description: next };
    });
  };

  const handleSellTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      sellType: value,
      ...(value === 'fixed'
        ? { startMode: 'immediate', scheduledDate: '', scheduledTime: '', duration: '' }
        : {})
    }));
  };

  const getCategoryLabel = (cat) => {
    if (!cat) return '';
    return language === 'EN' ? cat.title : (cat.titleMn || cat.title);
  };
  const selectedParentCategory = useMemo(
    () => categories.find((cat) => cat._id === parentCategory),
    [categories, parentCategory]
  );
  const selectedSubcategory = useMemo(
    () => subcategories.find((cat) => cat._id === formData.category),
    [subcategories, formData.category]
  );
  const selectedCategoryLabel = [
    getCategoryLabel(selectedParentCategory),
    getCategoryLabel(selectedSubcategory)
  ].filter(Boolean).join(' > ');

  const translatedLimitMessage = t('imageLimitWarning');
  const imageLimitMessage = translatedLimitMessage && translatedLimitMessage !== 'imageLimitWarning'
    ? translatedLimitMessage
    : DEFAULT_IMAGE_LIMIT_MESSAGE;
  const [showAuctionModal, setShowAuctionModal] = useState(false);
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
      // Fetch bid history to get top bidder info
      const bidHistoryResponse = await axios.get(
        buildApiUrl(`/api/bidding/${productId}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bidsData = bidHistoryResponse.data?.history || bidHistoryResponse.data || [];
      const pastBids = Array.isArray(bidsData) ? bidsData : [];

      if (pastBids.length === 0) {
        toast.error('Санал байхгүй байна. Хамгийн өндөр саналтай хэрэглэгчид зарах боломжгүй.');
        return;
      }

      const topBid = pastBids[0];
      const topBidder = topBid?.user?.name || 'Нэргүй';
      const topBidAmount = topBid?.price || currentBid;

      // Show detailed confirmation dialog with details
      const confirmMessage = `⚠️ CONFIRM INSTANT SALE\n\n` +
        `You are about to sell this item instantly to:\n\n` +
        `Buyer: ${topBidder}\n` +
        `Amount: $${formatNumber(topBidAmount.toString())}\n\n` +
        `This action is IRREVERSIBLE and will:\n` +
        `• End the auction immediately\n` +
        `• Mark the item as sold\n` +
        `• Notify the winning bidder\n\n` +
        `Are you absolutely sure you want to proceed?`;

      const firstConfirm = window.confirm(confirmMessage);
      if (!firstConfirm) return;

      // Second confirmation to prevent accidents
      const secondConfirm = window.confirm(
        `FINAL CONFIRMATION\n\n` +
        `This is your last chance to cancel.\n\n` +
        `Sell to ${topBidder} for $${formatNumber(topBidAmount.toString())}?`
      );
      if (!secondConfirm) return;

      const response = await axios.post(
        buildApiUrl(`/api/product/${productId}/sell-now`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${topBidder}-д ₮${formatNumber(topBidAmount.toString())}-р зарагдлаа!`);

      // Refresh products list
      const productsResponse = await axios.get(buildApiUrl('/api/product/my'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(productsResponse.data);

    } catch (error) {
      console.error('Sell product error:', error);
      const errorMessage = error.response?.data?.message || error.message || t('sellError');
      toast.error(errorMessage);
    }
  };
// Number formatting helpers
const formatNumber = (value) => {
  if (!value) return '';
  // Remove all non-digit characters
  const numericValue = value.toString().replace(/[^\d]/g, '');
  if (!numericValue) return '';
  // Add thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const unformatNumber = (value) => {
  if (!value) return '';
  // Remove commas and return plain number
  return value.toString().replace(/,/g, '');
};

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

      toast.warning(imageLimitMessage);

    } else if (selectionTrimmed) {

      toast.info(imageLimitMessage);

    }

  } else {
    // Format number fields with thousand separators
    const numberFields = ['startingBid', 'price', 'mileage', 'year', 'importYear'];

    if (numberFields.includes(name)) {
      const formattedValue = formatNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

  }

};

// Helper function to check if category is automotive
const isAutomotiveCategory = (categoryId) => {
  if (!categoryId || !categories.length) return false;
  const selectedCat = categories.find(c => c._id === categoryId);
  if (!selectedCat) return false;
  const titleMn = (selectedCat?.titleMn || '').toLowerCase();
  const titleEn = (selectedCat?.title || '').toLowerCase();
  return titleMn.includes('автомашин') ||
    titleMn.includes('машин') ||
    titleMn.includes('авто') ||
    titleEn.includes('car') ||
    titleEn.includes('vehicle') ||
    titleEn.includes('auto');
};

// Auto-generate title for cars when year, manufacturer, and model are filled
useEffect(() => {
  if (isAutomotiveCategory(formData.category) && formData.year && formData.manufacturer && formData.model) {
    const autoTitle = `${formData.year} ${formData.manufacturer} ${formData.model}`;
    if (formData.title !== autoTitle) {
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }
}, [formData.year, formData.manufacturer, formData.model, formData.category]);

// Handle parent category change
const handleParentCategoryChange = (e) => {
  const parentId = e.target.value;
  setParentCategory(parentId);

  // Clear subcategory selection
  setFormData(prev => ({ ...prev, category: '' }));

  // Find subcategories for this parent
  if (parentId) {
    const subs = categories.filter(cat => {
      if (!cat.parent) return false;
      const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
        ? cat.parent._id?.toString()
        : cat.parent?.toString();
      return parentCategoryId === parentId;
    });
    setSubcategories(subs);
  } else {
    setSubcategories([]);
  }
};

useEffect(() => {
  if (activeTab !== 'addProduct') return;
  if (!formData.category || categories.length === 0) return;

  const selected = categories.find(cat => cat._id === formData.category);
  if (!selected) return;

  if (selected.parent) {
    const parentId = typeof selected.parent === 'object' && selected.parent !== null
      ? selected.parent._id?.toString()
      : selected.parent?.toString();
    if (parentId && parentId !== parentCategory) {
      setParentCategory(parentId);
    }
    const subs = categories.filter(cat => {
      if (!cat.parent) return false;
      const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
        ? cat.parent._id?.toString()
        : cat.parent?.toString();
      return parentCategoryId === parentId;
    });
    setSubcategories(subs);
  } else {
    if (parentCategory !== selected._id) {
      setParentCategory(selected._id);
    }
    const subs = categories.filter(cat => {
      if (!cat.parent) return false;
      const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
        ? cat.parent._id?.toString()
        : cat.parent?.toString();
      return parentCategoryId === selected._id;
    });
    setSubcategories(subs);
  }
}, [activeTab, categories, formData.category, parentCategory]);

// AI category selection removed - use manual category selection instead

  const handleDeleteProduct = async (productId) => {
    if (window.confirm(t('confirmDelete'))) {
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
        toast.success(t('deletedSuccessfully'));
      } catch (error) {
        console.error('Delete product error:', error);
        const errorMessage = error.response?.data?.message || error.message || t('deleteError');
        toast.error(errorMessage);
      }
    }
  };

  const handleEditProduct = (product) => {
    // Calculate duration and endTime from bidDeadline
    const deadline = new Date(product.bidDeadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const hours = deadline.getHours();
    const minutes = deadline.getMinutes();
    const endTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    // Determine duration preset
    let duration = '7';
    if (diffDays <= 3) duration = '3';
    else if (diffDays <= 7) duration = '7';
    else duration = '14';

    // Find and set parent category
    const categoryId = product.category?._id || product.category || '';
    if (categoryId && categories.length > 0) {
      const selectedCat = categories.find(c => c._id === categoryId);
      if (selectedCat?.parent) {
        const parentId = typeof selectedCat.parent === 'object' && selectedCat.parent !== null
          ? selectedCat.parent._id?.toString()
          : selectedCat.parent?.toString();
        setParentCategory(parentId);

        // Find and set subcategories
        const subs = categories.filter(cat => {
          if (!cat.parent) return false;
          const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
            ? cat.parent._id?.toString()
            : cat.parent?.toString();
          return parentCategoryId === parentId;
        });
        setSubcategories(subs);
      }
    }

    const sellType = product.sellType || 'auction';

    // Load product data into form
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: sellType === 'fixed' ? (product.price || '') : '',
      startingBid: sellType === 'auction' ? (product.price || product.currentBid || '') : '',
      sellType: sellType,
      category: categoryId,
      height: product.height || '',
      length: product.length || '',
      width: product.width || '',
      weight: product.weight || '',
      bidThreshold: product.bidThreshold || '',
      bidDeadline: product.bidDeadline ? new Date(product.bidDeadline).toISOString().slice(0, 16) : '',
      images: product.images?.map((img, index) => ({
        preview: img.url,
        file: null,
        id: `existing-${index}`
      })) || [],
      duration: sellType === 'auction' ? duration : '',
      endTime: endTimeStr,
      startMode: 'immediate',
      scheduledDate: '',
      scheduledTime: '',
      manufacturer: product.manufacturer || '',
      model: product.model || '',
      year: product.year || '',
      mileage: product.mileage || '',
      engineSize: product.engineSize || '',
      fuelType: product.fuelType || '',
      transmission: product.transmission || '',
      color: product.color || '',
      condition: product.condition || '',
      shippingOrigin: product.shippingOrigin || ''
    });

    setEditingProductId(product._id);
    setActiveTab('addProduct');
    toast.info('Бараа засах горимд орлоо');
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await axios.post(buildApiUrl('/api/ai/generate-description'), {
        prompt: aiPrompt,
        title: formData.title,
        category: formData.category,
        condition: formData.condition,
        brand: formData.brand,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setFormData(prev => ({ ...prev, description: res.data.description }));
      setShowAiInput(false);
      setAiPrompt('');
      toast.success('Тайлбар амжилттай үүслээ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI тайлбар үүсгэхэд алдаа гарлаа');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExtendSubmit = async () => {
    if (!extendModal) return;
    const { product, days } = extendModal;
    setExtendLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const fd = new FormData();
      fd.append('title', product.title);
      fd.append('description', product.description || '');
      if (product.category?._id || product.category) fd.append('category', product.category?._id || product.category);
      fd.append('sellType', 'auction');
      fd.append('price', String(product.price || product.currentBid || 0));
      fd.append('startingBid', String(product.price || product.currentBid || 0));
      fd.append('startMode', 'immediate');
      fd.append('auctionDuration', String(days));
      if (product.images?.length) fd.append('existingImages', JSON.stringify(product.images.map(i => i.url || i.filePath)));
      await axios.put(buildApiUrl(`/api/product/${product._id}`), fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Зарын хугацаа ${days} өдрөөр сунгагдлаа`);
      setExtendModal(null);
      // Refresh listings
      const res = await axios.get(buildApiUrl('/api/product/my'), { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Сунгахад алдаа гарлаа');
    } finally {
      setExtendLoading(false);
    }
  };

  useEffect(() => {
    const pendingManageId = localStorage.getItem('pendingProductManage');
    if (!pendingManageId || products.length === 0) return;

    const productToEdit = products.find(product => product._id === pendingManageId);
    if (productToEdit) {
      setActiveTab('addProduct');
      handleEditProduct(productToEdit);
    }
    localStorage.removeItem('pendingProductManage');
  }, [products]);


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

  // Manual save draft handler
  const handleSaveDraft = () => {
    if (!formData.title && !formData.description) {
      toast.error('Ноорог хадгалахын тулд гарчиг эсвэл тайлбар оруулна уу');
      return;
    }

    saveToLocalStorage(draftKey, draftPayload);
    saveToLocalStorage(`${draftKey}-${Date.now()}`, draftPayload);
    toast.success('Ноорог амжилттай хадгалагдлаа! Дараа үргэлжлүүлж болно.');
    setActiveTab('drafts');
  };

  const handleLoadDraft = async (key) => {
    const draft = getDraft(key);
    if (!draft) return;

    const { _draftMeta, ...draftData } = draft || {};


    setEditingProductId(null);

    // First switch to addProduct tab
    setActiveTab('addProduct');

    // Fetch categories if not already loaded
    let categoriesData = categories;
    if (categories.length === 0) {
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.token;
        const response = await axios.get(buildApiUrl('/api/category/'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        categoriesData = response.data;
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Ангилал ачаалахад алдаа гарлаа');
        return;
      }
    }

    // Set form data - use complete replacement instead of merge
    setFormData(draftData);

    // Restore parent category and subcategories from _draftMeta OR from draftData.category
    let restoredParentCategory = _draftMeta?.parentCategory || '';

    // If no parent in meta but we have a category, find its parent
    if (!restoredParentCategory && draftData.category && categoriesData.length > 0) {
      const selectedCat = categoriesData.find(c => c._id === draftData.category);
      if (selectedCat?.parent) {
        restoredParentCategory = typeof selectedCat.parent === 'object' && selectedCat.parent !== null
          ? selectedCat.parent._id?.toString()
          : selectedCat.parent?.toString();
      }
    }

    setParentCategory(restoredParentCategory);
    setCategoryPickerTab(_draftMeta?.categoryPickerTab || 'list');
    setCategoryKeyword(_draftMeta?.categoryKeyword || '');


    // Restore subcategories list based on parent category
    if (restoredParentCategory && categoriesData.length > 0) {
      const subs = categoriesData.filter(cat => {
        if (!cat.parent) return false;
        const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
          ? cat.parent._id?.toString()
          : cat.parent?.toString();
        return parentCategoryId === restoredParentCategory.toString();
      });
      setSubcategories(subs);
    } else {
      setSubcategories([]);
    }

    deleteDraft(key);
    toast.info('Ноорог ачааллагдлаа');
  };

  const handleTabChange = (nextTab) => {
    if (activeTab === nextTab) return;
    if (activeTab === 'addProduct') {
      const hasContent = Boolean(
        formData.title ||
        formData.description ||
        formData.category ||
        parentCategory ||
        categoryKeyword ||
        formData.startingBid ||
        formData.price ||
        (formData.images && formData.images.length)
      );
      if (hasContent) {
        const shouldSave = window.confirm('Save this draft before leaving?');
        if (shouldSave) {
          saveToLocalStorage(draftKey, draftPayload);
          saveToLocalStorage(`${draftKey}-${Date.now()}`, draftPayload);
          toast.success('Ноорог амжилттай хадгалагдлаа! Дараа үргэлжлүүлж болно.');
          setActiveTab('drafts');
          return;
        }
      }
    }
    setActiveTab(nextTab);
    const params = new URLSearchParams(location.search);
    params.delete('tab');
    const search = params.toString();
    const targetPath = nextTab ? `/profile/tab/${nextTab}` : '/profile';
    navigate(search ? `${targetPath}?${search}` : targetPath, { replace: true });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setUploading(true);
  setSubmitError(null);
  setSubmitSuccess(null);

  // Check required fields
  const missingFields = [];
  if (!formData.title) missingFields.push('Гарчиг');
  if (!formData.description) missingFields.push('Тайлбар');
  if (!formData.category) missingFields.push('Ангилал');

  if (missingFields.length > 0) {
    const msg = `Дараах талбаруудыг бөглөнө үү: ${missingFields.join(', ')}`;
    toast.error(msg);
    setSubmitError(msg);
    setUploading(false);
    return;
  }

  if (formData.sellType === 'auction') {
    if (!formData.startingBid) {
      const msg = t('pleaseEnterStartingBid');
      toast.error(msg);
      setSubmitError(msg);
      setUploading(false);
      return;
    }

    if (!formData.duration) {
      const msg = t('pleaseSelectDuration');
      toast.error(msg);
      setSubmitError(msg);
      setUploading(false);
      return;
    }

    if (formData.startMode === 'scheduled') {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        const msg = t('pleaseEnterStartDateTime');
        toast.error(msg);
        setSubmitError(msg);
        setUploading(false);
        return;
      }

      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        const msg = t('startDateMustBeFuture');
        toast.error(msg);
        setSubmitError(msg);
        setUploading(false);
        return;
      }
    }
  } else if (!formData.price) {
    const msg = 'Тогтмол үнэ оруулна уу';
    toast.error(msg);
    setSubmitError(msg);
    setUploading(false);
    return;
  }

  if (formData.images.length === 0) {
    const msg = t('pleaseUploadImage');
    toast.error(msg);
    setSubmitError(msg);
    setUploading(false);
    return;
  }

  try {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    const formDataToSend = new FormData();

    // Add core fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    // Use the selected category only; avoid fallback that can mismatch backend schema
    if (formData.category) {
      formDataToSend.append('category', formData.category);
    }
    formDataToSend.append('sellType', formData.sellType);
    if (formData.sellType === 'auction') {
      const startPrice = String(unformatNumber(formData.startingBid));
      formDataToSend.append('price', startPrice);
      formDataToSend.append('startingBid', startPrice);
      formDataToSend.append('startMode', formData.startMode);
      formDataToSend.append('auctionDuration', String(formData.duration || '7'));
      if (formData.startMode === 'scheduled') {
        formDataToSend.append('scheduledDate', formData.scheduledDate);
        formDataToSend.append('scheduledTime', formData.scheduledTime);
      }
    } else {
      const fixedPrice = String(unformatNumber(formData.price));
      formDataToSend.append('price', fixedPrice);
      // Ensure auctionDuration present even for fixed to satisfy backend schema
      formDataToSend.append('auctionDuration', String(formData.duration || '7'));
      formDataToSend.append('startMode', formData.startMode || 'immediate');
    }
    if (formData.shippingOrigin) {
      formDataToSend.append('shippingOrigin', formData.shippingOrigin);
    }
    // Optional physical fields
    ['height','length','width','weight','bidThreshold'].forEach(f => {
      if (formData[f] !== '' && formData[f] !== null && formData[f] !== undefined) {
        formDataToSend.append(f, String(formData[f]));
      }
    });

    // Optional automotive fields
    ['manufacturer','model','year','mileage','engineSize','fuelType','transmission','color','condition'].forEach(f => {
      if (formData[f] !== '' && formData[f] !== null && formData[f] !== undefined) {
        // Unformat numeric fields (year, mileage) before sending
        const value = (f === 'year' || f === 'mileage') ? unformatNumber(formData[f]) : formData[f];
        formDataToSend.append(f, String(value));
      }
    });
    
    // Handle images: new uploads and existing URLs
    const existingImageUrls = [];
    formData.images.forEach((imageObj, index) => {
      if (imageObj.file) {
        // New image file to upload
        formDataToSend.append(`images`, imageObj.file);
      } else if (imageObj.preview) {
        // Existing image URL from server (when editing)
        existingImageUrls.push(imageObj.preview);
      }
    });

    // Send existing image URLs separately for editing
    if (editingProductId && existingImageUrls.length > 0) {
      formDataToSend.append('existingImages', JSON.stringify(existingImageUrls));
    }

    // Debug: log FormData entries
    for (const [key, val] of formDataToSend.entries()) {
    }

    let response;
    if (editingProductId) {
      // Update existing product
      response = await axios.put(
        buildApiUrl(`/api/product/${editingProductId}`),
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(t('productUpdatedSuccess'));
      setSubmitSuccess(t('productUpdatedSuccess'));
      setEditingProductId(null);
    } else {
      // Create new product
      response = await axios.post(
        buildApiUrl('/api/product/'),
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(t('productCreatedSuccess'));
      setSubmitSuccess(t('productCreatedSuccess'));
    }

    // Clear draft on successful submission
    deleteDraft(draftKey);

    setFormData({
      title: '',
      description: '',
      price: '',
      startingBid: '',
      sellType: 'auction',
      category: '',
      height: '',
      length: '',
      width: '',
      weight: '',
      bidThreshold: '',
      bidDeadline: '',
      images: [],
      // Yahoo Auctions-style fields
      startMode: 'immediate',
      scheduledDate: '',
      scheduledTime: '',
      duration: '7',
      endTime: '',
      // Automotive fields
      manufacturer: '',
      model: '',
      year: '',
      mileage: '',
      engineSize: '',
      fuelType: '',
      transmission: '',
      color: '',
      condition: '',
      shippingOrigin: ''
    });
    
    // Refresh products list
    const productsResponse = await axios.get(buildApiUrl('/api/product/my'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProducts(productsResponse.data);
    
    // Switch back to products tab and sync URL
    setActiveTab('myProducts');
    navigate('/profile/tab/myProducts', { replace: true });

  } catch (error) {
    console.error('Error submitting:', error);
    const errorMessage = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message || '????? ??????? ?????. ????? ???????? ???';
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
          <h2 className="mb-4">{t('loginRequired')}</h2>
          <p className="mb-4 text-muted">{t('loginToViewProfile')}</p>
          <a href="/login" className="btn btn-primary px-4 py-2">
            {t('login')}
          </a>
        </div>
      </div>
    );
  }


  return (
    <>
    <div style={{ minHeight: '100vh', background: isDarkMode ? '#0f172a' : '#f1f5f9' }}>

      {/* ── Profile Hero ── */}
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '20px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--bn-primary)', background: '#f1f5f9' }}>
              <img src={user.photo?.filePath || '/default.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <label htmlFor="profile-photo-upload" title={t('editPhoto')}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: 'var(--bn-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
              <FiCamera size={11} color="#fff" />
              <input type="file" id="profile-photo-upload" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{user.name}</h2>
              {user.isVerified && <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>✓ Verified</span>}
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{user.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 20, padding: '5px 12px' }}>
                <FiCreditCard size={13} color="var(--bn-primary)" />
                <span style={{ fontWeight: 700, fontSize: 14, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{user.balance?.toFixed(0) || '0'}₮</span>
              </div>
              <button onClick={() => handleTabChange('wallet')}
                style={{ background: 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiPlusCircle size={12} /> {t('addBalance')}
              </button>
              <button onClick={() => handleTabChange('addProduct')}
                style={{ background: 'transparent', color: isDarkMode ? '#94a3b8' : '#64748b', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 20, padding: '5px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiPlusCircle size={12} /> Sell
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            {[
              { label: 'Зарлагууд', value: products.length, icon: <FiShoppingBag size={14} color="var(--bn-primary)" /> },
              { label: 'Гүйлгээнүүд', value: transactions.length, icon: <FiClock size={14} color="#6366f1" /> },
            ].map((st, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 2 }}>
                  {st.icon}
                  <span style={{ fontSize: 20, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{st.value}</span>
                </div>
                <div style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5-Tab Navigation ── */}
      <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, position: 'sticky', top: 64, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex' }}>
          {[
            { tab: 'myProducts', label: 'Зарлагууд', icon: <FiShoppingBag size={14} />, count: products.length },
            { tab: 'bids',       label: 'Саналууд',  icon: <FiTrendingUp size={14} />, count: 0 },
            { tab: 'sellingDashboard', label: 'Хянах самбар', icon: <FiBarChart2 size={14} /> },
            { tab: 'wallet',     label: 'Хэтэвч',   icon: <FiCreditCard size={14} /> },
            { tab: 'profile',    label: 'Акаунт',   icon: <FiUser size={14} /> },
          ].map(({ tab, label, icon, count }) => {
            const isActive = activeTab === tab || (tab === 'myProducts' && activeTab === 'addProduct') || (tab === 'myProducts' && activeTab === 'drafts');
            return (
              <button key={tab} type="button" onClick={() => handleTabChange(tab)} style={{
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid var(--bn-primary)' : '2px solid transparent',
                padding: '14px 20px', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--bn-primary)' : (isDarkMode ? '#94a3b8' : '#64748b'),
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap', transition: 'color 0.15s',
              }}>
                {icon}{label}
                {count > 0 && <span style={{ background: isActive ? 'var(--bn-primary)' : (isDarkMode ? '#334155' : '#f1f5f9'), color: isActive ? '#fff' : (isDarkMode ? '#94a3b8' : '#64748b'), borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* ADD PRODUCT (hidden tab, accessible via Sell button) */}
        {activeTab === 'addProduct' && (
          <>
            <DraftStatusIndicator />
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiPlusCircle size={20} color="var(--bn-primary)" />
                  {editingProductId ? t('updateProduct') : t('addProduct')}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: isDarkMode ? '#64748b' : '#94a3b8' }}>Барааны мэдээллийг доор бөглөнө үү</p>
              </div>
              <button onClick={() => handleTabChange('myProducts')}
                style={{ background: 'transparent', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, padding: '7px 16px', fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← My Listings
              </button>
            </div>

            {/* Draft resume */}
            {previousDrafts.length > 0 && (
              <div style={{ marginBottom: 20, background: isDarkMode ? '#0f172a' : '#fffbeb', borderRadius: 10, padding: '12px 16px', border: `1px solid ${isDarkMode ? '#334155' : '#fde68a'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#64748b' : '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Хадгалсан ноорогууд</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {previousDrafts.slice(0, 3).map((draft) => (
                    <div key={draft.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 6, padding: '8px 12px', border: `1px solid ${isDarkMode ? '#334155' : '#fde68a'}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{draft.preview || 'Гарчиггүй ноорог'}</div>
                        <div style={{ fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8' }}>{new Date(draft.timestamp).toLocaleString()}</div>
                      </div>
                      <button type="button" onClick={() => handleLoadDraft(draft.key)}
                        style={{ background: '#eff6ff', color: 'var(--bn-primary)', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Resume</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {submitError && <div style={{ marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>{submitError}</div>}
              {submitSuccess && <div style={{ marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#16a34a', fontSize: 13 }}>{submitSuccess}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Photos card */}
                  <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bn-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Зургууд</div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <ImageUploader images={formData.images} onChange={(imgs) => setFormData(prev => ({ ...prev, images: imgs }))} thumbnailSize={140} helperText="Эхний зураг нүүр зураг болно." />
                    </div>
                  </div>

                  {/* Item Details card */}
                  <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bn-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Барааны мэдээлэл</div>
                    </div>
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Title *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Example: iPhone 13 Pro 128GB" required
                          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Category *</label>
                        <div style={{ border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 10, overflow: 'hidden', background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
                          <div style={{ display: 'flex' }}>
                            <div style={{ flex: 1, borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '10px 12px', maxHeight: 180, overflowY: 'auto' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? '#475569' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Category</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {categories.filter(cat => !cat.parent || (typeof cat.parent === 'object' && cat.parent === null)).map(cat => (
                                  <button key={cat._id} type="button" onClick={() => handleParentCategoryChange({ target: { value: cat._id } })}
                                    style={{ textAlign: 'left', background: parentCategory === cat._id ? '#eff6ff' : 'transparent', color: parentCategory === cat._id ? 'var(--bn-primary)' : (isDarkMode ? '#cbd5e1' : '#475569'), border: 'none', borderRadius: 5, padding: '6px 10px', fontSize: 13, cursor: 'pointer', fontWeight: parentCategory === cat._id ? 700 : 400 }}>
                                    {getCategoryLabel(cat)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div style={{ flex: 1, borderRight: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '10px 12px', maxHeight: 180, overflowY: 'auto' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? '#475569' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Subcategory</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {subcategories.length === 0
                                  ? <div style={{ fontSize: 12, color: isDarkMode ? '#64748b' : '#94a3b8', padding: '6px 10px' }}>Эхлээд ангилал сонгоно уу</div>
                                  : subcategories.map(sub => (
                                    <button key={sub._id} type="button" onClick={() => setFormData(prev => ({ ...prev, category: sub._id }))}
                                      style={{ textAlign: 'left', background: formData.category === sub._id ? '#eff6ff' : 'transparent', color: formData.category === sub._id ? 'var(--bn-primary)' : (isDarkMode ? '#cbd5e1' : '#475569'), border: 'none', borderRadius: 5, padding: '6px 10px', fontSize: 13, cursor: 'pointer', fontWeight: formData.category === sub._id ? 700 : 400 }}>
                                      {getCategoryLabel(sub)}
                                    </button>
                                  ))}
                              </div>
                            </div>
                            <div style={{ flex: '0 0 130px', padding: '10px 12px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? '#475569' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Сонгосон</div>
                              {formData.category
                                ? <span style={{ display: 'inline-block', background: '#eff6ff', color: 'var(--bn-primary)', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{selectedCategoryLabel}</span>
                                : <span style={{ fontSize: 12, color: isDarkMode ? '#475569' : '#94a3b8' }}>None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Condition</label>
                          <select name="condition" value={formData.condition} onChange={handleChange}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, outline: 'none' }}>
                            <option value="">Төлөв сонгоно уу</option>
                            <option value="new">New</option>
                            <option value="used">Used</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Хаанаас хүргэх</label>
                          <select name="shippingOrigin" value={formData.shippingOrigin || ''} onChange={handleChange}
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, outline: 'none' }}>
                            <option value="">Аймаг/хот сонгоно уу</option>
                            {['Arkhangai','Bayan-Olgii','Bayankhongor','Bulgan','Darkhan-Uul','Dornod','Dornogovi','Dundgovi','Govi-Altai','Govisumber','Khentii','Khovd','Khovsgol','Orkhon','Ovorkhangai','Selenge','Sukhbaatar','Tov','Ulaanbaatar','Umnugovi','Uvs','Zavkhan'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569' }}>Description *</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" onClick={() => setShowAiInput(v => !v)}
                              style={{ background: showAiInput ? '#eef2ff' : 'transparent', border: `1px solid ${showAiInput ? 'var(--bn-primary)' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, color: showAiInput ? 'var(--bn-primary)' : (isDarkMode ? '#94a3b8' : '#64748b'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              ✨ AI тайлбар
                            </button>
                            <button type="button" onClick={handleInsertDescriptionTemplate}
                              style={{ background: 'transparent', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>Загвар</button>
                          </div>
                        </div>
                        {showAiInput && (
                          <div style={{ marginBottom: 10, background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1.5px solid var(--bn-primary)`, borderRadius: 10, padding: 12 }}>
                            <p style={{ margin: '0 0 8px', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                              Юу зарж байгаагаа энгийнээр тайлбарла — AI тайлбар үүсгэнэ
                            </p>
                            <textarea
                              rows={3}
                              value={aiPrompt}
                              onChange={e => setAiPrompt(e.target.value)}
                              placeholder="Жишээ: 2 жил хэрэглэсэн iPhone 13. Дэлгэц нь бүрэн бүтэн, цэнэгийн багтаамж 89%. Хайрцаг болон цэнэглэгч хамт байгаа."
                              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 7, background: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 13, boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                            />
                            <button type="button" onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()}
                              style={{ marginTop: 8, padding: '7px 16px', background: aiLoading || !aiPrompt.trim() ? '#c7d2fe' : 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer' }}>
                              {aiLoading ? 'Үүсгэж байна...' : '✨ Тайлбар үүсгэх'}
                            </button>
                          </div>
                        )}
                        <textarea rows={5} name="description" value={formData.description} onChange={handleChange} placeholder="Барааны төлөв, брэнд, хэмжээ болон бусад мэдээллийг тайлбарлана уу." required
                          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

                  {/* Sale Type card */}
                  <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bn-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Зарах төрөл & Үнэ</div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                        {[{ value: 'auction', label: '🔨 Дуудлага' }, { value: 'fixed', label: '🏷️ Тогтмол үнэ' }].map(opt => (
                          <button key={opt.value} type="button" onClick={() => handleSellTypeChange(opt.value)}
                            style={{ padding: '10px 8px', border: `2px solid ${formData.sellType === opt.value ? 'var(--bn-primary)' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: 10, background: formData.sellType === opt.value ? '#eff6ff' : 'transparent', color: formData.sellType === opt.value ? 'var(--bn-primary)' : (isDarkMode ? '#94a3b8' : '#64748b'), fontWeight: formData.sellType === opt.value ? 700 : 500, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {formData.sellType === 'auction' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Эхлэх үнэ (MNT) *</label>
                            <input type="text" name="startingBid" value={formData.startingBid} onChange={handleChange} placeholder="0" required
                              style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Хугацаа *</label>
                            <select name="duration" value={formData.duration || ''} onChange={handleChange} required
                              style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, outline: 'none' }}>
                              <option value="">Сонгоно уу</option>
                              {['1','3','5','7','10','14'].map(d => <option key={d} value={d}>{d} өдөр</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 8 }}>Эхлэх цаг</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {[{ value: 'immediate', label: 'Одоо' }, { value: 'scheduled', label: 'Хуваарилах' }].map(opt => (
                                <button key={opt.value} type="button" onClick={() => setFormData(prev => ({ ...prev, startMode: opt.value }))}
                                  style={{ padding: '8px', border: `2px solid ${formData.startMode === opt.value ? '#22c55e' : (isDarkMode ? '#475569' : '#e2e8f0')}`, borderRadius: 8, background: formData.startMode === opt.value ? '#f0fdf4' : 'transparent', color: formData.startMode === opt.value ? '#16a34a' : (isDarkMode ? '#94a3b8' : '#64748b'), fontWeight: formData.startMode === opt.value ? 700 : 500, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {formData.startMode === 'scheduled' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 5 }}>Огноо *</label>
                                <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required
                                  style={{ width: '100%', padding: '9px 10px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 5 }}>Цаг *</label>
                                <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange} required
                                  style={{ width: '100%', padding: '9px 10px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                              </div>
                            </div>
                          )}
                          <div style={{ background: isDarkMode ? '#0f172a' : '#eff6ff', border: `1px solid ${isDarkMode ? '#334155' : '#bfdbfe'}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: isDarkMode ? '#93c5fd' : '#3b82f6' }}>
                            {formData.startMode === 'immediate'
                              ? `Одоо эхэлнэ · ${formData.duration || '?'} өдрийн дараа дуусна`
                              : formData.scheduledDate && formData.scheduledTime
                                ? `${formData.scheduledDate} ${formData.scheduledTime}-д эхэлнэ · ${formData.duration || '?'} өдрийн дараа дуусна`
                                : 'Огноо болон цагийг сонгоно уу'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: 6 }}>Тогтмол үнэ (MNT) *</label>
                          <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="0" required
                            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions card */}
                  <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button type="submit" disabled={uploading}
                      style={{ width: '100%', padding: 13, background: uploading ? '#94a3b8' : 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {uploading ? t('submitting') : editingProductId ? t('updateProduct') : t('submit')}
                    </button>
                    <button type="button" onClick={handleSaveDraft} disabled={uploading}
                      style={{ width: '100%', padding: 11, background: 'transparent', color: isDarkMode ? '#94a3b8' : '#64748b', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 10, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <FiFileText size={14} /> Ноорог хадгалах
                    </button>
                    {editingProductId && (
                      <button type="button"
                        onClick={() => { setEditingProductId(null); setFormData({ title: '', description: '', price: '', startingBid: '', sellType: 'auction', category: '', height: '', length: '', width: '', weight: '', bidThreshold: '', bidDeadline: '', images: [], duration: '', endTime: '', manufacturer: '', model: '', year: '', mileage: '', engineSize: '', fuelType: '', transmission: '', color: '', condition: '', startMode: 'immediate', scheduledDate: '', scheduledTime: '', shippingOrigin: '' }); toast.info('Засвар цуцлагдлаа'); }}
                        style={{ width: '100%', padding: 11, background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                        {t('cancel')}
                      </button>
                    )}
                    <p style={{ margin: 0, fontSize: 11, color: isDarkMode ? '#475569' : '#94a3b8', textAlign: 'center' }}>Өөрчлөлт 30 секунд тутамд ноорог болж хадгалагдана</p>
                  </div>

                </div>
              </div>
            </form>
          </>
        )}

        {/* TAB 1: LISTINGS (products + drafts) */}
        {activeTab === 'myProducts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Products Section */}
            <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 12, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiShoppingBag size={18} color="var(--bn-primary)" />
                  Миний зарууд
                  <span style={{ background: '#eff6ff', color: 'var(--bn-primary)', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{products.length}</span>
                  {products.filter(p => !p.sold && p.auctionStatus === 'active').length > 0 && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                      🟢 {products.filter(p => !p.sold && p.auctionStatus === 'active').length} идэвхтэй
                    </span>
                  )}
                  {products.filter(p => !p.sold && p.auctionStatus === 'ended').length > 0 && (
                    <span style={{ background: '#fffbeb', color: '#b45309', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                      ⏰ {products.filter(p => !p.sold && p.auctionStatus === 'ended').length} дууссан
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden', background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
                    <FiSearch size={14} color="#94a3b8" style={{ margin: '0 0 0 10px', flexShrink: 0 }} />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="Хайх..."
                      style={{ border: 'none', background: 'transparent', padding: '7px 10px', fontSize: 13, color: isDarkMode ? '#f1f5f9' : '#1e293b', outline: 'none', width: 160 }} />
                    <button onClick={handleSearch} disabled={loading} style={{ background: 'var(--bn-primary)', color: '#fff', border: 'none', padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}>Go</button>
                  </div>
                  <button onClick={() => handleTabChange('addProduct')}
                    style={{ background: 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiPlusCircle size={13} /> New listing
                  </button>
                </div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '50px 0', color: isDarkMode ? '#64748b' : '#94a3b8' }}>{t('loadingProducts')}</div>
                ) : error ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14, color: '#dc2626' }}>
                    {error} <button onClick={() => window.location.reload()} style={{ marginLeft: 8, background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 5, padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
                  </div>
                ) : products.length > 0 ? (() => {
                  const filtered = searchTerm
                    ? products.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
                    : products;
                  const active    = filtered.filter(p => !p.sold && p.auctionStatus === 'active');
                  const scheduled = filtered.filter(p => !p.sold && p.auctionStatus === 'scheduled');
                  const ended     = filtered.filter(p => !p.sold && p.auctionStatus === 'ended');
                  const sold      = filtered.filter(p => p.sold);

                  const ProductCard = ({ product }) => (
                    <div style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 10, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                      {product.image && <img src={product.image} alt={product.title} onClick={() => navigate(`/products/${product._id}`)} style={{ width: '100%', height: 150, objectFit: 'cover', cursor: 'pointer' }} />}
                      <div style={{ padding: '10px 12px' }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: 'var(--bn-accent)', fontSize: 14 }}>{(product.currentBid || product.price || 0).toLocaleString()}₮</span>
                          {product.bidDeadline && !product.sold && product.auctionStatus === 'active' && (
                            <span style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                              {new Date(product.bidDeadline) > new Date()
                                ? `${Math.ceil((new Date(product.bidDeadline) - new Date()) / 3600000)}ц үлдсэн`
                                : 'Дуусч байна'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          <button onClick={() => navigate(`/products/${product._id}`)} style={{ flex: '1 0 auto', padding: '5px 8px', background: 'transparent', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 5, fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>Харах</button>
                          {!product.sold && product.auctionStatus === 'active' && (<>
                            <button onClick={() => handleSellProduct(product._id, product.currentBid)} style={{ flex: '1 0 auto', padding: '5px 8px', background: '#dcfce7', border: 'none', borderRadius: 5, fontSize: 11, color: '#16a34a', fontWeight: 600, cursor: 'pointer' }}>Шууд зарах</button>
                            <button onClick={() => handleEditProduct(product)} style={{ flex: '1 0 auto', padding: '5px 8px', background: '#eff6ff', border: 'none', borderRadius: 5, fontSize: 11, color: 'var(--bn-primary)', fontWeight: 600, cursor: 'pointer' }}>Засах</button>
                          </>)}
                          {!product.sold && product.auctionStatus === 'scheduled' && (
                            <button onClick={() => handleEditProduct(product)} style={{ flex: '1 0 auto', padding: '5px 8px', background: '#eff6ff', border: 'none', borderRadius: 5, fontSize: 11, color: 'var(--bn-primary)', fontWeight: 600, cursor: 'pointer' }}>Засах</button>
                          )}
                          {!product.sold && product.auctionStatus === 'ended' && (<>
                            <button onClick={() => setExtendModal({ product, days: 7 })} style={{ flex: '1 0 auto', padding: '5px 8px', background: '#eff6ff', border: 'none', borderRadius: 5, fontSize: 11, color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>Сунгах</button>
                            <button onClick={() => { const np = { ...product }; delete np._id; np.sold = false; np.auctionStatus = 'active'; np.currentBid = 0; handleEditProduct(np); setEditingProductId(null); toast.info('Шинэ зар үүсгэж байна'); }} style={{ flex: '1 0 auto', padding: '5px 8px', background: '#f0fdf4', border: 'none', borderRadius: 5, fontSize: 11, color: '#16a34a', fontWeight: 600, cursor: 'pointer' }}>Дахин зарах</button>
                          </>)}
                          {!product.sold && <button onClick={() => handleDeleteProduct(product._id)} style={{ flex: '1 0 auto', padding: '5px 8px', background: '#fef2f2', border: 'none', borderRadius: 5, fontSize: 11, color: '#dc2626', fontWeight: 600, cursor: 'pointer' }}>Устгах</button>}
                        </div>
                      </div>
                    </div>
                  );

                  const Section = ({ label, color, bg, border, icon, items, emptyText }) => items.length === 0 ? null : (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>{icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
                        <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, border: `1px solid ${border}` }}>{items.length}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {items.map(p => <ProductCard key={p._id} product={p} />)}
                      </div>
                    </div>
                  );

                  return filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13 }}>
                      "{searchTerm}" гэж хайсан үр дүн олдсонгүй
                    </div>
                  ) : (
                    <>
                      <Section label="Одоо зарагдаж байна" color="#16a34a" bg="#f0fdf4" border="#86efac" icon="🟢" items={active} />
                      <Section label="Хуваарьт" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" icon="🕐" items={scheduled} />
                      <Section label="Хугацаа дууссан" color="#b45309" bg="#fffbeb" border="#fde68a" icon="⏰" items={ended} />
                      <Section label="Зарагдсан" color="#64748b" bg="#f8fafc" border="#e2e8f0" icon="✅" items={sold} />
                    </>
                  );
                })() : (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <FiShoppingBag size={44} color={isDarkMode ? '#334155' : '#e2e8f0'} style={{ marginBottom: 14 }} />
                    <h4 style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontWeight: 500, marginBottom: 12 }}>{searchTerm ? `No results for "${searchTerm}"` : t('noProductsYet')}</h4>
                    {!searchTerm && (
                      <button onClick={() => handleTabChange('addProduct')} style={{ background: 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <FiPlusCircle size={14} /> New listing
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Drafts sub-section */}
            {draftItems.length > 0 && (
              <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 12, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                <div style={{ padding: '14px 24px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <FiFileText size={15} color="var(--bn-primary)" /> Ноорогууд
                    <span style={{ background: '#eff6ff', color: 'var(--bn-primary)', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>{draftItems.length}</span>
                  </h4>
                </div>
                <div style={{ padding: '12px 24px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {draftItems.map((draft) => (
                      <div key={draft.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 8, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: isDarkMode ? '#f1f5f9' : '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.preview || 'Гарчиггүй ноорог'}</div>
                          <div style={{ fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: 1 }}>{new Date(draft.timestamp).toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginLeft: 10, flexShrink: 0 }}>
                          <button type="button" onClick={() => handleLoadDraft(draft.key)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Үргэлжлүүлэх</button>
                          <button type="button" onClick={() => deleteDraft(draft.key)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BIDS & WATCHLIST */}
        {activeTab === 'bids' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTrendingUp size={20} color="var(--bn-primary)" /> My Bids
              </h2>
              <p style={{ margin: '4px 0 16px', fontSize: 13, color: isDarkMode ? '#64748b' : '#94a3b8' }}>Таны дуудлагын бүх үйл ажиллагаа</p>
            </div>
            <MyBidsPanel />
            <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  👁️ Watchlist
                </span>
                <button onClick={() => navigate('/allproduct')}
                  style={{ background: 'transparent', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 7, padding: '5px 12px', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
                  Хайх
                </button>
              </div>
              <div style={{ padding: '36px 20px', textAlign: 'center', color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13 }}>
                {language === 'MN' ? 'Одоогоор хадгалсан бараа алга' : 'No saved items yet — click the heart icon on any product'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DASHBOARD */}
        {activeTab === 'sellingDashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBarChart2 size={20} color="var(--bn-primary)" /> Selling Dashboard
              </h2>
              <p style={{ margin: '4px 0 16px', fontSize: 13, color: isDarkMode ? '#64748b' : '#94a3b8' }}>Таны бүх зарлагуудын тойм</p>
            </div>
            <SellerDashboard />
          </div>
        )}

        {/* TAB 4: WALLET + HISTORY */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Balance + Recharge */}
            <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 12, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCreditCard size={18} color="var(--bn-primary)" /> Wallet
                </h3>
                <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '6px 16px', fontWeight: 700, fontSize: 18 }}>{user.balance?.toFixed(2) || '0.00'}₮</div>
              </div>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <form onSubmit={handleRecharge}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 6 }}>{t('rechargeAmount')}</label>
                    <div style={{ display: 'flex', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, overflow: 'hidden' }}>
                      <span style={{ padding: '10px 14px', background: 'var(--bn-primary)', color: '#fff', fontWeight: 700 }}>₮</span>
                      <input type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} min="5000" step="1000" required placeholder="5000, 10000, 50000..."
                        style={{ flex: 1, border: 'none', padding: '10px 14px', background: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? '#f1f5f9' : '#1e293b', fontSize: 14, outline: 'none' }} />
                    </div>
                    <div style={{ fontSize: 12, color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: 4 }}>{t('minAmount')}</div>
                  </div>
                  {rechargeError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{rechargeError}</div>}
                  {rechargeSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, color: '#16a34a', fontSize: 13, marginBottom: 10 }}>{t('rechargeSuccess')} {user.balance?.toFixed(2)}₮</div>}
                  <button type="submit" disabled={rechargeLoading}
                    style={{ width: '100%', padding: 12, background: rechargeLoading ? '#94a3b8' : 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: rechargeLoading ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
                    {rechargeLoading ? t('recharging') : t('rechargeWithQpay')}
                  </button>
                  <button type="button"
                    onClick={async () => {
                      try {
                        const token = JSON.parse(localStorage.getItem('user'))?.token;
                        const response = await axios.post(buildApiUrl('/api/users/add-test-funds'), { amount: 1000000 }, { headers: { Authorization: `Bearer ${token}` } });
                        setUser(prev => ({ ...prev, balance: response.data.newBalance }));
                        toast.success(`1,000,000₮ туршилтын мөнгө нэмэгдлээ!`);
                      } catch (error) { toast.error(error.response?.data?.message || 'Алдаа гарлаа'); }
                    }}
                    style={{ width: '100%', padding: 10, background: 'transparent', border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: '#16a34a', fontWeight: 600, cursor: 'pointer' }}>
                    Add Test Funds (1,000,000₮)
                  </button>
                </form>
                <div>
                  {qpayInvoice && qpayInvoice.payment?.qrImage ? (
                    <div style={{ textAlign: 'center', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 10, padding: 20, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                      <h4 style={{ margin: '0 0 14px', color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>QPay</h4>
                      <img src={`data:image/png;base64,${qpayInvoice.payment.qrImage}`} alt="QPay QR" style={{ maxWidth: 180, marginBottom: 8 }} />
                      <p style={{ fontSize: 12, color: isDarkMode ? '#64748b' : '#94a3b8' }}>{t('scanQrCode')}</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 10, padding: 28, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                      <img src="/qpay-logo.png" alt="QPay" style={{ height: 36, marginBottom: 10 }} />
                      <h5 style={{ color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 6 }}>{t('qpaySystem')}</h5>
                      <p style={{ fontSize: 12, color: isDarkMode ? '#64748b' : '#94a3b8', lineHeight: 1.5 }}>{t('qpayInstructions')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 12, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ padding: '14px 24px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <FiClock size={15} color="#6366f1" /> {t('transactionHistory')}
                </h4>
                <span style={{ background: '#eff6ff', color: 'var(--bn-primary)', fontWeight: 700, fontSize: 12, padding: '2px 9px', borderRadius: 10 }}>{transactions.length}</span>
              </div>
              <div style={{ padding: '0 24px 16px' }}>
                {transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 13 }}>{t('noTransactions')}</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ fontSize: 11, fontWeight: 600, color: isDarkMode ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {[t('product'), t('price'), t('seller'), t('date')].map((h, i) => (
                            <th key={i} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx._id} style={{ borderBottom: `1px solid ${isDarkMode ? '#1e293b' : '#f8fafc'}` }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {tx.product?.image && <img src={tx.product.image} alt="" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 6 }} />}
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{tx.product?.title || t('unknownProduct')}</div>
                                  <div style={{ fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8' }}>{tx.product?.category}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--bn-accent)' }}>{tx.amount}₮</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: isDarkMode ? '#cbd5e1' : '#475569' }}>{tx.seller?.name || t('unknownSeller')}</td>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8' }}>
                              {new Date(tx.createdAt).toLocaleDateString()}<br />{new Date(tx.createdAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACCOUNT (profile info + settings) */}
        {activeTab === 'profile' && (() => {
          const soldCount = products.filter(p => p.sold).length;
          const unsoldCount = products.filter(p => !p.sold && p.auctionStatus === 'ended').length;
          const activeCount = products.filter(p => !p.sold && p.auctionStatus === 'active').length;
          const initials = (user.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Hero card */}
              <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--bn-primary)', background: 'linear-gradient(135deg,var(--bn-primary),#4338CA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user.photo?.filePath
                      ? <img src={user.photo.filePath} alt="Профайл" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{initials}</span>
                    }
                  </div>
                  <label htmlFor="hero-photo-upload" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: 'var(--bn-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                    <FiCamera size={11} color="#fff" />
                    <input type="file" id="hero-photo-upload" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: 2 }}>{user.email}</div>
                </div>
                {user.isVerified && (
                  <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid #bbf7d0' }}>✓ Баталгаажсан</span>
                )}
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {[
                  { label: 'Нийт зарлагууд', value: products.length, color: 'var(--bn-primary)', bg: '#eff6ff', border: '#bfdbfe' },
                  { label: 'Амжилттай зарсан', value: soldCount,   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Зарагдаагүй',     value: unsoldCount,  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                  { label: 'Идэвхтэй',         value: activeCount,  color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                  { label: 'Үлдэгдэл',         value: `${(user.balance || 0).toLocaleString()}₮`, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
                ].map((s, i) => (
                  <div key={i} style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 12, border: `1px solid ${isDarkMode ? '#334155' : s.border}`, padding: '16px 18px' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Info + Settings row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* My info */}
                <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bn-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('myInfo')}</div>
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: t('fullName'), value: user.name },
                      { label: t('email'), value: user.email },
                      { label: t('phoneNumber'), value: user.phone || t('notProvided') },
                    ].map((item, i) => (
                      <div key={i}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: isDarkMode ? '#64748b' : '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</label>
                        <div style={{ padding: '9px 12px', background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 14, color: isDarkMode ? '#f1f5f9' : '#1e293b', fontWeight: 500 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${isDarkMode ? '#334155' : '#f1f5f9'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bn-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('settings')}</div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 10, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isDarkMode ? <FiMoon size={14} /> : <FiSun size={14} />} {t('darkMode')}
                        </div>
                        <div style={{ fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: 2 }}>Цайвар ба харанхуй горим солих</div>
                      </div>
                      <div onClick={toggleTheme} style={{ width: 44, height: 24, borderRadius: 12, background: isDarkMode ? 'var(--bn-primary)' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: isDarkMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: '12px 14px', background: isDarkMode ? '#0f172a' : '#f8fafc', borderRadius: 10, border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>Гүйлгээнүүд</div>
                        <div style={{ fontSize: 11, color: isDarkMode ? '#64748b' : '#94a3b8', marginTop: 2 }}>{t('transactionHistory')}</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--bn-primary)' }}>{transactions.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 14, border: '1px solid #fee2e2', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Аккаунтыг удирдах</div>
                  <div style={{ fontSize: 12, color: isDarkMode ? '#64748b' : '#94a3b8' }}>Аккаунтаа устгавал таны бүх мэдээлэл болон бүтээгдэхүүний түүхийг дахин сэргээх боломжгүй.</div>
                </div>
                <button type="button" onClick={handleDeleteAccount} disabled={isDeletingAccount}
                  style={{ flexShrink: 0, padding: '9px 18px', background: 'transparent', border: '1px solid #dc2626', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: isDeletingAccount ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {isDeletingAccount ? 'Устгаж байна...' : 'Аккаунт устгах'}
                </button>
              </div>

            </div>
          );
        })()}

      </div>
    </div>

    {/* Extend auction modal */}
    {extendModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => { if (e.target === e.currentTarget) setExtendModal(null); }}>
        <div style={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>⏰ Хугацаа сунгах</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {extendModal.product.title}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: isDarkMode ? '#94a3b8' : '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Хэдэн өдрөөр сунгах вэ?</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {[1, 3, 5, 7, 10, 14].map(d => (
              <button key={d} onClick={() => setExtendModal(m => ({ ...m, days: d }))}
                style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${extendModal.days === d ? 'var(--bn-primary)' : (isDarkMode ? '#475569' : '#e2e8f0')}`,
                  background: extendModal.days === d ? '#eef2ff' : 'transparent',
                  color: extendModal.days === d ? 'var(--bn-primary)' : (isDarkMode ? '#94a3b8' : '#64748b'),
                  fontWeight: extendModal.days === d ? 700 : 500, fontSize: 14, cursor: 'pointer' }}>
                {d}ө
              </button>
            ))}
          </div>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: isDarkMode ? '#64748b' : '#94a3b8' }}>
            Шинэ дуусах огноо: <strong style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
              {new Date(Date.now() + extendModal.days * 86400000).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </strong>
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExtendSubmit} disabled={extendLoading}
              style={{ flex: 1, padding: '11px 0', background: 'var(--bn-primary)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: extendLoading ? 'not-allowed' : 'pointer', opacity: extendLoading ? 0.7 : 1 }}>
              {extendLoading ? 'Боловсруулж байна...' : `${extendModal.days} өдрөөр сунгах`}
            </button>
            <button onClick={() => setExtendModal(null)} disabled={extendLoading}
              style={{ padding: '11px 18px', background: 'transparent', border: `1.5px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`, borderRadius: 10, fontSize: 14, color: isDarkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
              Болих
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
