import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiShoppingBag, FiPlusCircle, FiClock, FiCreditCard, FiSettings,FiCamera, FiRefreshCw, FiSearch, FiMoon, FiSun, FiTrendingUp, FiBarChart2} from 'react-icons/fi';
import { BsArrowRightShort, BsCheckCircleFill } from 'react-icons/bs';
import "../../index.css";
import "./ProfileForm.css";
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { buildApiUrl } from '../../config/api';
import { MyBidsPanel } from '../../components/bidding/MyBidsPanel';
import { SellerDashboard } from '../../components/selling/SellerDashboard';
import { CarSelector } from '../../components/CarSelector';
import { CategorySuggester } from '../../components/CategorySuggester';
import { Editor } from '@tinymce/tinymce-react';
import { useAutosave } from '../../hooks/useAutosave';
import { useDraft } from '../../context/DraftContext';
import DraftStatusIndicator from '../../components/DraftStatusIndicator';

const MAX_IMAGE_UPLOADS = 20;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_IMAGE_LIMIT_MESSAGE = 'You can upload up to 20 images (5MB max each).';

export const Profile = () => {
  const toast = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
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
  const [qpayInvoice, setQpayInvoice] = useState({
  urls: [],
  qr_image: ''
});

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    startingBid: '',
    sellType: 'auction', // Always auction now
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
    duration: '',           // Auction duration in days
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
    condition: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Draft auto-save hooks
  const { getDraft, deleteDraft, saveToLocalStorage } = useDraft();
  const draftKey = editingProductId ? `editProduct-${editingProductId}` : 'addProduct';

  // Auto-save form data (only when in addProduct tab)
  useAutosave(
    draftKey,
    activeTab === 'addProduct' ? formData : null,
    2000 // 2 second debounce
  );

  // Load draft on component mount
  useEffect(() => {
    if (activeTab === 'addProduct' && !editingProductId) {
      const draft = getDraft(draftKey);
      if (draft && (draft.title || draft.description)) {
        const shouldRestore = window.confirm(
          `Found a saved draft from ${new Date(draft._timestamp).toLocaleString()}. Would you like to restore it?`
        );
        if (shouldRestore) {
          setFormData(prev => ({ ...prev, ...draft }));
          toast.showToast('Draft restored successfully!', 'success');
        } else {
          deleteDraft(draftKey);
        }
      }
    }
  }, []); // Only run once on mount

  // Initialize tab from query (?tab=addProduct)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

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
  
  const titleMaxLen = 40;
  const descMaxLen = 1000;
  const translatedLimitMessage = t('imageLimitWarning');
  const imageLimitMessage = translatedLimitMessage && translatedLimitMessage !== 'imageLimitWarning'
    ? translatedLimitMessage
    : DEFAULT_IMAGE_LIMIT_MESSAGE;

  const dropRef = useRef(null);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    const fakeEvent = { target: { name: 'images', files } };
    handleChange(fakeEvent);
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
      // Fetch bid history to get top bidder info
      const bidHistoryResponse = await axios.get(
        buildApiUrl(`/api/bidding/${productId}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bidsData = bidHistoryResponse.data?.history || bidHistoryResponse.data || [];
      const pastBids = Array.isArray(bidsData) ? bidsData : [];

      if (pastBids.length === 0) {
        toast.error('No bids yet. Cannot sell to top bidder.');
        return;
      }

      const topBid = pastBids[0];
      const topBidder = topBid?.user?.name || 'Anonymous';
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

      toast.success(`Item sold to ${topBidder} for $${formatNumber(topBidAmount.toString())}!`);

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

// Handle AI category suggestion selection
const handleAICategorySelect = (suggestedCategoryName) => {
  const searchName = suggestedCategoryName.toLowerCase().trim();

  // Create a scoring function to find the best match
  const scoreCategory = (cat) => {
    const titleEn = (cat.title || '').toLowerCase().trim();
    const titleMn = (cat.titleMn || '').toLowerCase().trim();

    // Exact match gets highest score
    if (titleEn === searchName || titleMn === searchName) {
      return cat.parent ? 100 : 200; // Prefer parent categories for exact matches
    }

    // Check for word-level matches (e.g., "electronics" matches "Electronics" but not "Car Electronics")
    const wordsEn = titleEn.split(/\s+/);
    const wordsMn = titleMn.split(/\s+/);
    const searchWords = searchName.split(/\s+/);

    // If all search words match category words exactly
    const allWordsMatchEn = searchWords.every(sw => wordsEn.some(w => w === sw));
    const allWordsMatchMn = searchWords.every(sw => wordsMn.some(w => w === sw));

    if (allWordsMatchEn || allWordsMatchMn) {
      return cat.parent ? 80 : 150; // Prefer parent categories
    }

    // Partial word match
    const hasPartialMatchEn = wordsEn.some(w => w.includes(searchName) || searchName.includes(w));
    const hasPartialMatchMn = wordsMn.some(w => w.includes(searchName) || searchName.includes(w));

    if (hasPartialMatchEn || hasPartialMatchMn) {
      return cat.parent ? 40 : 60; // Still prefer parent categories
    }

    return 0;
  };

  // Score all categories and find the best match
  const scoredCategories = categories
    .map(cat => ({ cat, score: scoreCategory(cat) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredCategories.length === 0) {
    toast.warning(`Could not find category matching "${suggestedCategoryName}". Please select manually.`);
    return;
  }

  const matchedCategory = scoredCategories[0].cat;

  // Check if this is a subcategory or parent category
  if (matchedCategory.parent) {
    // It's a subcategory - set both parent and subcategory
    const parentId = typeof matchedCategory.parent === 'object' && matchedCategory.parent !== null
      ? matchedCategory.parent._id?.toString()
      : matchedCategory.parent?.toString();

    setParentCategory(parentId);

    // Update subcategories list
    const subs = categories.filter(cat => {
      if (!cat.parent) return false;
      const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
        ? cat.parent._id?.toString()
        : cat.parent?.toString();
      return parentCategoryId === parentId;
    });
    setSubcategories(subs);

    // Set the selected subcategory
    setFormData(prev => ({ ...prev, category: matchedCategory._id }));
    toast.success(`Category set to: ${matchedCategory.title || matchedCategory.titleMn}`);
  } else {
    // It's a parent category - just set the parent
    setParentCategory(matchedCategory._id);

    // Update subcategories list
    const subs = categories.filter(cat => {
      if (!cat.parent) return false;
      const parentCategoryId = typeof cat.parent === 'object' && cat.parent !== null
        ? cat.parent._id?.toString()
        : cat.parent?.toString();
      return parentCategoryId === matchedCategory._id;
    });
    setSubcategories(subs);

    // Clear subcategory selection
    setFormData(prev => ({ ...prev, category: '' }));
    toast.info(`Parent category set to: ${matchedCategory.title || matchedCategory.titleMn}. Please select a subcategory.`);
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

    // Load product data into form
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      startingBid: product.price || product.currentBid || '',
      sellType: 'auction',
      category: categoryId,
      height: product.height || '',
      length: product.length || '',
      width: product.width || '',
      weight: product.weight || '',
      bidThreshold: product.bidThreshold || '',
      bidDeadline: product.bidDeadline ? new Date(product.bidDeadline).toISOString().slice(0, 16) : '',
      images: product.images?.map(img => ({ preview: img.url, file: null })) || [],
      duration: duration,
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
      condition: product.condition || ''
    });

    setEditingProductId(product._id);
    setActiveTab('addProduct');
    toast.info('Бараа засах горимд орлоо');
  };

  useEffect(() => {
    const pendingManageId = localStorage.getItem('pendingProductManage');
    if (!pendingManageId || products.length === 0) return;

    const productToEdit = products.find(product => product._id === pendingManageId);
    if (productToEdit) {
      setActiveTab('addProduct');
      handleEditProduct(productToEdit);
      toast.info(t('settings') || 'Opening listing editor');
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
      toast.error('Please enter a title or description to save as draft');
      return;
    }

    saveToLocalStorage(draftKey, formData);
    toast.success('Draft saved successfully! You can continue later.');
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setUploading(true);
  setSubmitError(null);
  setSubmitSuccess(null);

  if (!formData.title || !formData.description || !formData.category) {
    const msg = t('pleaseFillAllFields');
    toast.error(msg);
    setSubmitError(msg);
    setUploading(false);
    return;
  }

  if (!formData.startingBid) {
    const msg = t('pleaseEnterStartingBid');
    toast.error(msg);
    setSubmitError(msg);
    setUploading(false);
    return;
  }

  // Validate auction duration
  if (!formData.duration) {
    const msg = t('pleaseSelectDuration');
    toast.error(msg);
    setSubmitError(msg);
    setUploading(false);
    return;
  }

  // Validate scheduled start fields if scheduled mode
  if (formData.startMode === 'scheduled') {
    if (!formData.scheduledDate || !formData.scheduledTime) {
      const msg = t('pleaseEnterStartDateTime');
      toast.error(msg);
      setSubmitError(msg);
      setUploading(false);
      return;
    }

    // Validate that scheduled start is in the future
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      const msg = t('startDateMustBeFuture');
      toast.error(msg);
      setSubmitError(msg);
      setUploading(false);
      return;
    }
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
    formDataToSend.append('category', formData.category || 'General');
    formDataToSend.append('sellType', 'auction');
    // Always use startingBid for auction (unformat to remove commas)
    formDataToSend.append('price', String(unformatNumber(formData.startingBid)));

    // Yahoo Auctions-style start system fields
    formDataToSend.append('startMode', formData.startMode);
    formDataToSend.append('auctionDuration', String(formData.duration));

    // Add scheduled start fields if in scheduled mode
    if (formData.startMode === 'scheduled') {
      formDataToSend.append('scheduledDate', formData.scheduledDate);
      formDataToSend.append('scheduledTime', formData.scheduledTime);
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
    
    // Ensure category is always set (default to empty string if not provided)
    if (!formData.category || formData.category === '') {
      formDataToSend.append('category', 'General');
    }
    
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
      duration: '',
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
      condition: ''
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
    <div className="container-fluid px-0">
      <div className={`profile-header py-4 ${isDarkMode ? 'bg-dark text-white' : 'bg-gradient-primary text-white'}`}>
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
          title={t('editPhoto')}
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
          <span className={`badge fs-6 px-3 py-2 me-3 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white text-primary'}`}>
            {user.balance?.toFixed(2) || '0.00'}₮
          </span>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => setActiveTab('')}
          >
            {t('addBalance')}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

      <div className="container mt-n5">
        <div className="row">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 mb-4 profile-sidebar-card">
              <div className="card-body p-0">
                
                
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <button 
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === 'myProducts' ? 'active' : ''}`}
                      onClick={() => setActiveTab('myProducts')}
                    >
                      <FiShoppingBag className="me-2" />
                      {t('myProducts')}
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
                      {t('addProduct')}
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
                      {t('transactionHistory')}
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === 'bids' ? 'active' : ''}`}
                      onClick={() => setActiveTab('bids')}
                    >
                      <FiTrendingUp className="me-2" />
                      My bids
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      type="button"
                      className={`nav-link d-flex align-items-center ${activeTab === 'sellingDashboard' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sellingDashboard')}
                    >
                      <FiBarChart2 className="me-2" />
                      Selling dashboard
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
                      {t('addBalance')}
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
                      {t('myInfo')}
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
                      {t('settings')}
                      <BsArrowRightShort className="ms-auto" />
                    </button>
                  </li>
                </ul>


              </div>
            </div>

            <div className="card shadow-sm border-0 mb-4 profile-sidebar-card">
              <div className="card-body">
                <h6 className="card-title text-muted mb-3">{t('profileStats')}</h6>
                <div className="stat-item d-flex justify-content-between mb-2">
                  <span>{t('products')}</span>
                  <span className="fw-bold">{products.length}</span>
                </div>
                <div className="stat-item d-flex justify-content-between mb-2">
                  <span>{t('transactionHistory')}</span>
                  <span className="fw-bold">{transactions.length}</span>
                </div>
                <div className="stat-item d-flex justify-content-between">
                  <span>{t('balance')}</span>
                  <span className="fw-bold">{user.balance?.toFixed(2) || '0.00'}₮</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-9">
            {activeTab === 'addProduct' && (
            <>
              {/* Draft Status Indicator */}
              <DraftStatusIndicator />

              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                      <FiPlusCircle className="me-2" />
                      {editingProductId ? t('updateProduct') : t('addProduct')}
                    </h4>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setActiveTab('myProducts')}
                    >
                      {t('myProducts')}
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="row g-3">
                      {submitError && (
                        <div className="col-12">
                          <div className="alert alert-danger py-2">{submitError}</div>
                        </div>
                      )}
                      {submitSuccess && (
                        <div className="col-12">
                          <div className="alert alert-success py-2">{submitSuccess}</div>
                        </div>
                      )}
                      <div className="col-12">
                        <h5 className="section-title mb-3 text-primary">
                          <span className="bg-primary bg-opacity-10 px-3 py-1 rounded">{t('myInfo')}</span>
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
                            <option value="">{t('selectParentCategory') || 'Select Parent Category'}</option>
                            {categories
                              .filter(cat => !cat.parent || (typeof cat.parent === 'object' && cat.parent === null))
                              .map((parentCat) => (
                                <option key={parentCat._id} value={parentCat._id}>
                                  {language === 'EN' ? parentCat.title : (parentCat.titleMn || parentCat.title)}
                                </option>
                              ))}
                          </select>
                          <label htmlFor="parentCategory">{t('parentCategory') || 'Parent Category'}*</label>
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
                            <option value="">{t('selectSubcategory') || 'Select Subcategory'}</option>
                            {subcategories.map((subCat) => (
                              <option key={subCat._id} value={subCat._id}>
                                {language === 'EN' ? subCat.title : (subCat.titleMn || subCat.title)}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="category">{t('subcategory') || 'Subcategory'}*</label>
                          {parentCategory && subcategories.length === 0 && (
                            <small className="text-muted">
                              {t('noSubcategories') || 'No subcategories available'}
                            </small>
                          )}
                        </div>
                      </div>

                      {/* AI Category Suggester - NEW FEATURE */}
                      <div className="col-12 mt-3">
                        <CategorySuggester
                          title={formData.title}
                          description={formData.description}
                          currentCategory={formData.category}
                          onCategorySelect={handleAICategorySelect}
                        />
                      </div>

                      {/* Automotive Fields - Show immediately after category if it's a car */}
                      {isAutomotiveCategory(formData.category) && (
                        <>
                          <div className="col-12 mt-3">
                            <h5 className="section-title mb-3 text-primary">
                              <span className="bg-primary bg-opacity-10 px-3 py-1 rounded">{t('automotiveInfo')}</span>
                            </h5>
                          </div>

                          {/* Car Selector - Uses NHTSA API */}
                          <CarSelector
                            manufacturer={formData.manufacturer}
                            model={formData.model}
                            year={formData.year}
                            onManufacturerChange={(value) => setFormData(prev => ({ ...prev, manufacturer: value }))}
                            onModelChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                            onYearChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                          />
                        </>
                      )}

                      {/* Title */}
                      <div className="col-12 col-md-6">
                        <label className="form-label">{t('productName')}*</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={(e) => {
                            if (e.target.value.length <= titleMaxLen) handleChange(e);
                          }}
                          placeholder={isAutomotiveCategory(formData.category) ? "2020 Toyota Camry" : "iPhone 13 Pro 128GB"}
                          required
                          readOnly={isAutomotiveCategory(formData.category) && formData.year && formData.manufacturer && formData.model}
                        />
                        <div className="text-end small text-muted">
                          {isAutomotiveCategory(formData.category) && formData.year && formData.manufacturer && formData.model ? (
                            <span className="text-success">
                              <i className="bi bi-magic"></i> Auto-generated
                            </span>
                          ) : (
                            `${formData.title.length}/${titleMaxLen}`
                          )}
                        </div>
                      </div>


                      {/* Description - Rich Text Editor */}
                      <div className="col-12">
                        <label className="form-label d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-text-paragraph me-2"></i>
                            {t('description')}*
                            <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-magic me-1"></i>Rich Text
                            </span>
                          </span>
                        </label>
                        <div className="border rounded" style={{ minHeight: '300px' }}>
                          <Editor
                            apiKey="no-api-key"
                            value={formData.description}
                            onEditorChange={(content) => {
                              // Allow HTML content, don't limit by character count for rich text
                              setFormData(prev => ({ ...prev, description: content }));
                            }}
                            init={{
                              height: 400,
                              menubar: true,
                              plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
                              ],
                              toolbar: 'undo redo | blocks fontsize | ' +
                                'bold italic forecolor backcolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'table image link emoticons | removeformat code preview help',
                              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                              placeholder: 'Write a creative and detailed product description...\n\n' +
                                'Tips:\n' +
                                '• Use formatting to highlight key features\n' +
                                '• Add images to showcase your product\n' +
                                '• Create tables for specifications\n' +
                                '• Use bullet points for easy reading',

                              // Image upload configuration
                              images_upload_handler: function (blobInfo, success, failure) {
                                // Convert to base64 for simplicity
                                const reader = new FileReader();
                                reader.readAsDataURL(blobInfo.blob());
                                reader.onloadend = function() {
                                  success(reader.result);
                                };
                                reader.onerror = function() {
                                  failure('Image upload failed');
                                };
                              },

                              // Paste cleanup
                              paste_data_images: true,
                              paste_as_text: false,

                              // Auto-resize
                              autoresize_bottom_margin: 20,

                              // Remove branding
                              branding: false,

                              // Promotion disabled
                              promotion: false
                            }}
                          />
                        </div>
                        <div className="text-muted small mt-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Use the toolbar to format your description with <strong>bold</strong>, <em>italic</em>, colors, lists, tables, images, and more!
                        </div>
                      </div>

                      {/* Starting Price */}
                      <div className="col-12 col-md-6">
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id="startingBid"
                            name="startingBid"
                            value={formData.startingBid}
                            onChange={handleChange}
                            placeholder=" "
                            required
                          />
                          <label htmlFor="startingBid">{t('startingPrice')} (₮)*</label>
                        </div>
                      </div>

                      {/* ===== Yahoo Auctions-style Start System ===== */}
                      <div className="col-12">
                        <h5 className="section-title mb-3 text-success">
                          <span className="bg-success bg-opacity-10 px-3 py-1 rounded">{t('auctionStartMode')}</span>
                        </h5>
                      </div>

                      {/* Start Mode Selection */}
                      <div className="col-12">
                        <div className="btn-group w-100" role="group">
                          <input
                            type="radio"
                            className="btn-check"
                            name="startMode"
                            id="startMode-immediate"
                            value="immediate"
                            checked={formData.startMode === 'immediate'}
                            onChange={(e) => setFormData(prev => ({ ...prev, startMode: e.target.value }))}
                            title={t('immediateStartTooltip')}
                          />
                          <label className="btn btn-outline-success" htmlFor="startMode-immediate">
                            ⚡ {t('startImmediately')}
                          </label>

                          <input
                            type="radio"
                            className="btn-check"
                            name="startMode"
                            id="startMode-scheduled"
                            value="scheduled"
                            checked={formData.startMode === 'scheduled'}
                            onChange={(e) => setFormData(prev => ({ ...prev, startMode: e.target.value }))}
                            title={t('scheduledStartTooltip')}
                          />
                          <label className="btn btn-outline-success" htmlFor="startMode-scheduled">
                            📅 {t('scheduleStart')}
                          </label>
                        </div>
                      </div>

                      {/* Scheduled Start: Date and Time Fields (shown only when scheduled is selected) */}
                      {formData.startMode === 'scheduled' && (
                        <>
                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input
                                type="date"
                                className="form-control"
                                id="scheduledDate"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                required
                              />
                              <label htmlFor="scheduledDate">{t('scheduledDate')}*</label>
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <div className="form-floating">
                              <input
                                type="time"
                                className="form-control"
                                id="scheduledTime"
                                name="scheduledTime"
                                value={formData.scheduledTime}
                                onChange={handleChange}
                                required
                              />
                              <label htmlFor="scheduledTime">{t('scheduledTime')}*</label>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Auction Duration Selection */}
                      <div className="col-12 col-md-6">
                        <div className="form-floating">
                          <select
                            className="form-select"
                            id="duration"
                            name="duration"
                            value={formData.duration || ''}
                            onChange={handleChange}
                            required
                          >
                            <option value="">{t('selectDurationDays')}</option>
                            <option value="1">{t('day1')}</option>
                            <option value="3">{t('day3')}</option>
                            <option value="5">{t('day5')}</option>
                            <option value="7">{t('day7')}</option>
                            <option value="10">{t('day10')}</option>
                            <option value="14">{t('day14')}</option>
                          </select>
                          <label htmlFor="duration">{t('auctionDurationDays')}*</label>
                        </div>
                      </div>

                      {/* Display calculated end time */}
                      <div className="col-12 col-md-6">
                        <div className="alert alert-info mb-0 py-2">
                          {formData.startMode === 'immediate' ? (
                            <small>
                              ⚡ {t('auctionStartsNow')} {formData.duration || '?'} {t('auctionEndsAfter')}
                            </small>
                          ) : (
                            <small>
                              📅 {formData.scheduledDate && formData.scheduledTime
                                ? `${formData.scheduledDate} ${formData.scheduledTime} ${t('auctionStartsAt')}`
                                : t('pleaseSelectDateTime')}
                              {formData.duration && `, ${formData.duration} ${t('auctionEndsAfter')}`}
                            </small>
                          )}
                        </div>
                      </div>
                      {/* ===== End of Start System ===== */}

                      {/* Additional Automotive Details (mileage, engine, fuel, etc.) */}
                      {isAutomotiveCategory(formData.category) && (
                        <>

                          <div className="col-md-6">
                            <div className="form-floating">
                              <input
                                type="text"
                                className="form-control"
                                id="mileage"
                                name="mileage"
                                value={formData.mileage}
                                onChange={handleChange}
                                placeholder=" "
                              />
                              <label htmlFor="mileage">{t('mileage')} (км)</label>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-floating">
                              <input
                                type="text"
                                className="form-control"
                                id="engineSize"
                                name="engineSize"
                                value={formData.engineSize}
                                onChange={handleChange}
                                placeholder=" "
                              />
                              <label htmlFor="engineSize">{t('engineSize')} (2.0L, 3.5L, ...)</label>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-floating">
                              <select
                                className="form-select"
                                id="fuelType"
                                name="fuelType"
                                value={formData.fuelType}
                                onChange={handleChange}
                              >
                                <option value="">{t('selectCategory')}</option>
                                <option value="Бензин">Бензин</option>
                                <option value="Дизель">Дизель</option>
                                <option value="Цахилгаан">Цахилгаан</option>
                                <option value="Гибрид">Гибрид</option>
                                <option value="Хий">Хий</option>
                              </select>
                              <label htmlFor="fuelType">{t('fuelType')}</label>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-floating">
                              <select
                                className="form-select"
                                id="transmission"
                                name="transmission"
                                value={formData.transmission}
                                onChange={handleChange}
                              >
                                <option value="">{t('selectCategory')}</option>
                                <option value="Автомат">Автомат</option>
                                <option value="Механик">Механик</option>
                                <option value="CVT">CVT</option>
                              </select>
                              <label htmlFor="transmission">{t('transmission')}</label>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-floating">
                              <input
                                type="text"
                                className="form-control"
                                id="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                placeholder=" "
                              />
                              <label htmlFor="color">{t('color')}</label>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="form-floating">
                              <select
                                className="form-select"
                                id="condition"
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                              >
                                <option value="">{language === 'MN' ? 'Байдал сонгох' : 'Select Condition'}</option>
                                <option value="Шинэ">{language === 'MN' ? 'Шинэ' : 'Brand New'}</option>
                                <option value="Орж ирээд явааγүй">{language === 'MN' ? 'Орж ирээд явааγүй' : 'Imported, Not Driven'}</option>
                                <option value="Хуучин">{language === 'MN' ? 'Хуучин' : 'Used/Old'}</option>
                              </select>
                              <label htmlFor="condition">{language === 'MN' ? 'Байдал' : 'Condition'}</label>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="col-12 mt-3">
                        <h5 className="section-title mb-3 text-primary">
                          <span className="bg-primary bg-opacity-10 px-3 py-1 rounded">{t('additionalInfo')}</span>
                        </h5>
                      </div>

                      <div className="col-12">
                        <div
                          ref={dropRef}
                          onDragOver={onDragOver}
                          onDrop={onDrop}
                          className="image-upload-container border rounded p-4 text-center"
                          style={{ borderStyle: 'dashed' }}
                        >
                          <div className="upload-content">
                            <div className="upload-icon mb-3">
                              <i className="bi bi-cloud-arrow-up fs-1 text-muted"></i>
                            </div>
                            <h6>{t('dragOrSelect')}</h6>
                            <p className="text-muted mb-2">JPG, PNG (≤ 5MB), {t('maxImages')}</p>
                            <label htmlFor="imageUpload" className="btn btn-outline-primary">
                              {t('selectImages')}
                            </label>
                            <input
                              type="file"
                              id="imageUpload"
                              className="d-none"
                              name="images"
                              onChange={handleChange}
                              accept="image/*"
                              multiple
                            />
                          </div>
                        </div>
                        {formData.images.length > 0 && (
                          <div className="mt-3">
                            <h6 className="mb-2">{t('uploadedImages')}</h6>
                            <div className="d-flex flex-wrap gap-2">
                              {formData.images.map((image, index) => (
                                <div key={index} className="position-relative" style={{ width: '110px' }}>
                                  <img
                                    src={image.preview}
                                    alt={`Preview ${index}`}
                                    className="img-thumbnail"
                                    style={{ height: '110px', objectFit: 'cover' }}
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

                      <div className="col-12 mt-4">
                        <div className="d-grid gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary py-3"
                            disabled={uploading}
                          >
                            {uploading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                {t('submitting')}
                              </>
                            ) : editingProductId ? (
                              t('updateProduct')
                            ) : (
                              <>
                                <i className="bi bi-check-circle me-2"></i>
                                {t('submit')}
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-secondary py-2"
                            onClick={handleSaveDraft}
                            disabled={uploading}
                          >
                            <i className="bi bi-save me-2"></i>
                            Save as Draft
                          </button>
                        </div>
                        {editingProductId && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary py-3 w-100 mt-2"
                            onClick={() => {
                              setEditingProductId(null);
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
                                duration: '',
                                endTime: '',
                                manufacturer: '',
                                model: '',
                                year: '',
                                mileage: '',
                                engineSize: '',
                                fuelType: '',
                                transmission: '',
                                color: '',
                                condition: ''
                              });
                              toast.info('Засах горим цуцлагдлаа');
                            }}
                          >
                            {t('cancel')}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </>
            )}

{activeTab === 'myProducts' && (
  <div className="card shadow-sm border-0 mb-4">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FiShoppingBag className="me-2" />
          {t('myProducts')}
        </h4>
        <div className="d-flex align-items-center">
          <div className="input-group me-3 profile-search-pill shadow-sm rounded-pill px-3 py-1" style={{ width: '250px', background: '#f8fafc' }}>
            <span className="input-group-text bg-transparent border-0">
              <FiSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control bg-transparent"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="btn btn-outline-secondary rounded-pill ms-2"
              type="button"
              onClick={handleSearch}
              disabled={loading}
            >
              {t('searchButtonLabel') || t('search')}
            </button>
          </div>
          <span className="badge bg-primary rounded-pill">{products.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('loading')}</span>
          </div>
          <p className="mt-3">{t('loadingProducts')}</p>
        </div>
      ) : error ? (
        <div className="alert alert-warning">
          <p>{t('errorOccurred')} {error}</p>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => window.location.reload()}
          >
            {t('retry')}
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
                      {product.sold ? t('sold') : t('notSold')}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-grow-1"
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      {t('details')}
                    </button>

                    {/* Sell Now - only for active auctions with bids */}
                    {!product.sold && product.auctionStatus === 'active' && (
                      <button
                        className="btn btn-sm btn-success flex-grow-1"
                        onClick={() => handleSellProduct(product._id, product.currentBid)}
                        title="End auction now and sell to top bidder"
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Sell Now
                      </button>
                    )}

                    {/* Edit - only for active auctions */}
                    {!product.sold && product.auctionStatus === 'active' && (
                      <button
                        className="btn btn-sm btn-outline-warning flex-grow-1"
                        onClick={() => handleEditProduct(product)}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        {t('edit')}
                      </button>
                    )}

                    {/* Extend Auction - for ended but unsold auctions */}
                    {!product.sold && product.auctionStatus === 'ended' && (
                      <button
                        className="btn btn-sm btn-outline-info flex-grow-1"
                        onClick={() => {
                          handleEditProduct(product);
                          toast.info('Update the auction duration to extend');
                        }}
                        title="Extend auction duration"
                      >
                        <i className="bi bi-clock-history me-1"></i>
                        Extend
                      </button>
                    )}

                    {/* Relist - ONLY for ended but unsold auctions (no bids or no one could afford) */}
                    {!product.sold && product.auctionStatus === 'ended' && (
                      <button
                        className="btn btn-sm btn-outline-success flex-grow-1"
                        onClick={() => {
                          // Create a new listing based on this product
                          const newProduct = { ...product };
                          delete newProduct._id;
                          newProduct.sold = false;
                          newProduct.auctionStatus = 'active';
                          newProduct.currentBid = 0;
                          handleEditProduct(newProduct);
                          setEditingProductId(null); // Make it a new product
                          toast.info('Creating new listing from this product');
                        }}
                        title="Create new auction from this product"
                      >
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Relist
                      </button>
                    )}

                    {/* Delete - always available for unsold items */}
                    {!product.sold && (
                      <button
                        className="btn btn-sm btn-outline-danger flex-grow-1"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        {t('delete')}
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
                ? `${t('noSearchResults')} "${searchTerm}"`
                : t('noProductsYet')}
            </h5>
            {!searchTerm && (
              <button
                className="btn btn-primary mt-3"
                onClick={() => setActiveTab('addProduct')}
              >
                <FiPlusCircle className="me-2" />
                {t('addProduct')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)}
            {activeTab === 'bids' && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 d-flex align-items-center">
                      <FiTrendingUp className="me-2" />
                      My bidding
                    </h4>
                  </div>
                  <MyBidsPanel />
                </div>
              </div>
            )}

            {activeTab === 'sellingDashboard' && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 d-flex align-items-center">
                      <FiBarChart2 className="me-2" />
                      Selling dashboard
                    </h4>
                  </div>
                  <SellerDashboard />
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                      <FiClock className="me-2" />
                      {t('transactionHistory')}
                    </h4>
                    <span className="badge bg-primary rounded-pill">{transactions.length}</span>
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('loading')}</span>
                      </div>
                      <p className="mt-3">{t('loading')}</p>
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
                        <h5 className="text-muted">{t('noTransactions')}</h5>
                        <p className="text-muted">{t('yourTransactions')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>{t('product')}</th>
                            <th>{t('price')}</th>
                            <th>{t('seller')}</th>
                            <th>{t('date')}</th>
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
                                    <strong>{transaction.product?.title || t('unknownProduct')}</strong>
                                    <div className="text-muted small">{transaction.product?.category}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="fw-bold text-primary">{transaction.amount}₮</td>
                              <td>{transaction.seller?.name || t('unknownSeller')}</td>

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
          {t('addBalance')}
        </h4>
        <span className="badge bg-primary rounded-pill">
          {user.balance?.toFixed(2) || '0.00'}₮
        </span>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <form onSubmit={handleRecharge}>
            <div className="mb-3">
              <label className="form-label">{t('rechargeAmount')}</label>
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
              <div className="form-text">{t('minAmount')}</div>
            </div>

            {rechargeError && (
              <div className="alert alert-danger">{rechargeError}</div>
            )}

            {rechargeSuccess && (
              <div className="alert alert-success">
                {t('rechargeSuccess')} {user.balance?.toFixed(2)}₮
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 py-3 mb-2"
              disabled={rechargeLoading}
            >
              {rechargeLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('recharging')}
                </>
              ) : (
                t('rechargeWithQpay')
              )}
            </button>

            {/* Test Funds Button - For Development/Testing */}
            <button
              type="button"
              className="btn btn-outline-success w-100 py-2"
              onClick={async () => {
                try {
                  const token = JSON.parse(localStorage.getItem('user'))?.token;
                  const testAmount = 1000000; // Add 1,000,000₮ for testing

                  const response = await axios.post(
                    buildApiUrl('/api/users/add-test-funds'),
                    { amount: testAmount },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  setUser(prev => ({ ...prev, balance: response.data.newBalance }));
                  toast.success(`Added ${testAmount.toLocaleString()}₮ test funds! New balance: ${response.data.newBalance.toLocaleString()}₮`);
                } catch (error) {
                  console.error('Add test funds error:', error);
                  toast.error(error.response?.data?.message || 'Failed to add test funds');
                }
              }}
            >
              <i className="bi bi-cash-stack me-2"></i>
              Add Test Funds (1,000,000₮)
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
          <p className="text-muted small">{t('scanQrCode')}</p>
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
                <h5 className="card-title text-muted mb-3">{t('qpaySystem')}</h5>
                <p className="text-muted small">
                  {t('qpayInstructions')}
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
                      {t('profile')}
                    </h4>
                    <button className="btn btn-sm btn-outline-primary">
                      <FiSettings className="me-1" />
                      {t('settings')}
                    </button>
                  </div>

                  <div className="row">

                    <div className="col-md-4">
                      <div className="profile-info-card p-4 rounded bg-light mb-4 h-100">
                        <h5 className="mb-4 text-primary">{t('myInfo')}</h5>
                        <div className="mb-3">
                          <label className="form-label text-muted">{t('fullName')}</label>
                          <div className="form-control bg-white">{user.name || ''}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted">{t('email')}</label>
                          <div className="form-control bg-white">{user.email || ''}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted">{t('phoneNumber')}</label>
                          <div className="form-control bg-white">{user.phone || t('notProvided')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="profile-stats-card p-4 rounded bg-light h-100">
                        <h5 className="mb-4 text-primary">{t('profileStats')}</h5>
                        <div className="stat-item d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded">
                          <div>
                            <FiShoppingBag className="me-2 text-primary" />
                            <span>{t('myProducts')}</span>
                          </div>
                          <span className="badge bg-primary rounded-pill">{products.length}</span>
                        </div>
                        <div className="stat-item d-flex justify-content-between align-items-center mb-3 p-3 bg-white rounded">
                          <div>
                            <FiClock className="me-2 text-primary" />
                            <span>{t('transactionHistory')}</span>
                          </div>
                          <span className="badge bg-primary rounded-pill">{transactions.length}</span>
                        </div>
                        <div className="stat-item d-flex justify-content-between align-items-center p-3 bg-white rounded">
                          <div>
                            <FiCreditCard className="me-2 text-primary" />
                            <span>{t('balance')}</span>
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
                      {t('settings')}
                    </h4>
                  </div>

                  <div className="settings-section">
                    <h5 className="mb-3 text-primary">{t('appearance')}</h5>

                    <div className="card bg-light border-0 p-4 mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">
                            {isDarkMode ? <FiMoon className="me-2" /> : <FiSun className="me-2" />}
                            {t('darkMode')}
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

                    <div className="alert alert-info">
                      <strong>💡 {t('tip')}</strong> {t('darkModeTip')}
                    </div>

                    <div className="settings-section mt-4">
                      <h5 className="mb-3 text-danger">Аккаунтыг удирдах</h5>
                      <div className="card border border-danger bg-light">
                        <div className="card-body">
                          <p className="text-muted small mb-3">
                            Аккаунтаа устгавал таны бүх мэдээлэл болон бүтээгдэхүүний түүхийг дахин сэргээх боломжгүй.
                          </p>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount}
                          >
                            {isDeletingAccount ? 'Устгаж байна...' : 'Аккаунт устгах'}
                          </button>
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

  
