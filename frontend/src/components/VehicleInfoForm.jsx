import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

export const VehicleInfoForm = ({ formData, onFormDataChange }) => {
  const { t } = useLanguage();
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState('');
  const [decodedVinInfo, setDecodedVinInfo] = useState(null);

  // Handle VIN decode
  const handleVINDecode = async () => {
    const vin = formData.vin;

    if (!vin || vin.length !== 17) {
      setVinError('VIN must be 17 characters');
      return;
    }

    setVinDecoding(true);
    setVinError('');

    try {
      const response = await axios.get(buildApiUrl(`/api/product/vin/decode/${vin}`));

      if (response.data.success) {
        setDecodedVinInfo(response.data.data);

        // Auto-fill year if available
        if (response.data.data.modelYear && response.data.data.modelYear !== 'Unknown') {
          onFormDataChange('year', response.data.data.modelYear);
        }

        // Auto-fill make if available from manufacturer
        if (response.data.data.manufacturer && !response.data.data.manufacturer.includes('Unknown')) {
          // Extract brand name from manufacturer string
          const brandName = response.data.data.manufacturer.split('(')[0].trim();
          onFormDataChange('make', brandName);
        }
      }
    } catch (error) {
      setVinError(error.response?.data?.message || 'Failed to decode VIN');
    } finally {
      setVinDecoding(false);
    }
  };

  // Handle item specific field changes
  const handleItemSpecificChange = (key, value) => {
    const updatedSpecifics = { ...formData.itemSpecifics, [key]: value };
    onFormDataChange('itemSpecifics', updatedSpecifics);
  };

  const removeItemSpecific = (key) => {
    const updatedSpecifics = { ...formData.itemSpecifics };
    delete updatedSpecifics[key];
    onFormDataChange('itemSpecifics', updatedSpecifics);
  };

  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const addItemSpecific = () => {
    if (newSpecKey && newSpecValue) {
      handleItemSpecificChange(newSpecKey, newSpecValue);
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  return (
    <>
      {/* Vehicle Information Section */}
      <div className="col-12 mt-3">
        <h5 className="section-title mb-3 text-info">
          <span className="bg-info bg-opacity-10 px-3 py-1 rounded">
            <i className="bi bi-car-front me-2"></i>{t('vehicleInformation') || 'Vehicle Information'}
          </span>
        </h5>
      </div>

      {/* VIN Number with Decoder */}
      <div className="col-md-6">
        <label className="form-label">
          {t('vin')} (Vehicle Identification Number)
        </label>
        <div className="input-group">
          <input
            type="text"
            className={`form-control text-uppercase ${vinError ? 'is-invalid' : ''}`}
            name="vin"
            value={formData.vin || ''}
            onChange={(e) => {
              onFormDataChange('vin', e.target.value.toUpperCase());
              setVinError('');
              setDecodedVinInfo(null);
            }}
            placeholder="1HGBH41JXMN109186"
            maxLength={17}
          />
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleVINDecode}
            disabled={vinDecoding || !formData.vin || formData.vin.length !== 17}
          >
            {vinDecoding ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Decoding...
              </>
            ) : (
              <>
                <i className="bi bi-search me-1"></i>Decode
              </>
            )}
          </button>
        </div>
        {vinError && <div className="invalid-feedback d-block">{vinError}</div>}
        {decodedVinInfo && (
          <div className="alert alert-success mt-2 py-2 small">
            <strong>✓ VIN Decoded:</strong>
            <br />
            Manufacturer: {decodedVinInfo.manufacturer}
            <br />
            Year: {decodedVinInfo.modelYear}
          </div>
        )}
        <small className="text-muted">17-character vehicle identification number</small>
      </div>

      {/* Mileage */}
      <div className="col-md-6">
        <label className="form-label">{t('mileage')}</label>
        <div className="input-group">
          <input
            type="number"
            className="form-control"
            name="mileage"
            value={formData.mileage || ''}
            onChange={(e) => onFormDataChange('mileage', e.target.value)}
            placeholder="50000"
            min="0"
          />
          <span className="input-group-text">km</span>
        </div>
      </div>

      {/* Transmission */}
      <div className="col-md-4">
        <label className="form-label">{t('transmission')}</label>
        <select
          className="form-select"
          name="transmission"
          value={formData.transmission || ''}
          onChange={(e) => onFormDataChange('transmission', e.target.value)}
        >
          <option value="">Select Transmission</option>
          <option value="automatic">{t('automatic')}</option>
          <option value="manual">{t('manual')}</option>
          <option value="cvt">{t('cvt')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>

      {/* Fuel Type */}
      <div className="col-md-4">
        <label className="form-label">{t('fuelType')}</label>
        <select
          className="form-select"
          name="fuelType"
          value={formData.fuelType || ''}
          onChange={(e) => onFormDataChange('fuelType', e.target.value)}
        >
          <option value="">Select Fuel Type</option>
          <option value="gasoline">{t('gasoline')}</option>
          <option value="diesel">{t('diesel')}</option>
          <option value="electric">{t('electric')}</option>
          <option value="hybrid">{t('hybrid')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>

      {/* Vehicle Title */}
      <div className="col-md-4">
        <label className="form-label">{t('vehicleTitle')}</label>
        <select
          className="form-select"
          name="vehicleTitle"
          value={formData.vehicleTitle || ''}
          onChange={(e) => onFormDataChange('vehicleTitle', e.target.value)}
        >
          <option value="">Select Title Status</option>
          <option value="clean">{t('clean')}</option>
          <option value="salvage">{t('salvage')}</option>
          <option value="rebuilt">{t('rebuilt')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>

      {/* Item Specifics (Custom Fields) */}
      <div className="col-12 mt-3">
        <h6 className="mb-3">
          <i className="bi bi-list-stars me-2"></i>
          {t('itemSpecifics')} (Optional Custom Fields)
        </h6>
      </div>

      {/* Display existing item specifics */}
      {formData.itemSpecifics && Object.keys(formData.itemSpecifics).length > 0 && (
        <div className="col-12">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Value</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(formData.itemSpecifics).map(([key, value]) => (
                  <tr key={key}>
                    <td><strong>{key}</strong></td>
                    <td>{value}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeItemSpecific(key)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add new item specific */}
      <div className="col-md-5">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Field Name (e.g., Engine Size)"
          value={newSpecKey}
          onChange={(e) => setNewSpecKey(e.target.value)}
        />
      </div>
      <div className="col-md-5">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Value (e.g., 3.5L V6)"
          value={newSpecValue}
          onChange={(e) => setNewSpecValue(e.target.value)}
        />
      </div>
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary w-100"
          onClick={addItemSpecific}
          disabled={!newSpecKey || !newSpecValue}
        >
          <i className="bi bi-plus-circle me-1"></i>Add
        </button>
      </div>

      {/* Rich Seller Description */}
      <div className="col-12 mt-4">
        <h5 className="section-title mb-3 text-warning">
          <span className="bg-warning bg-opacity-10 px-3 py-1 rounded">
            <i className="bi bi-file-richtext me-2"></i>{t('itemDescriptionFromSeller')}
          </span>
        </h5>
        <p className="small text-muted mb-3">
          Create a detailed, professional description with images, tables, and formatting.
          This will be displayed prominently on your product page.
        </p>
      </div>

      {/* TinyMCE Rich Text Editor */}
      <div className="col-12">
        <Editor
          apiKey="no-api-key" // Use 'no-api-key' for local development
          value={formData.sellerDescription || ''}
          onEditorChange={(content) => onFormDataChange('sellerDescription', content)}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | table | image | code | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            placeholder: 'Enter detailed vehicle description here...\n\nExample:\nThis 2023 Ford Transit has been professionally converted...',

            // Image upload (using base64 for simplicity)
            images_upload_handler: function (blobInfo, success, failure) {
              const reader = new FileReader();
              reader.readAsDataURL(blobInfo.blob());
              reader.onloadend = function() {
                success(reader.result);
              };
            },

            // Paste cleanup
            paste_data_images: true,
            paste_as_text: false,

            // Remove "Powered by TinyMCE" branding
            branding: false
          }}
        />
        <small className="text-muted">
          Use the toolbar above to format your description. You can add images, tables, lists, and more.
        </small>
      </div>

      {/* Vehicle History Report (Optional) */}
      <div className="col-12 mt-4">
        <h6 className="mb-3">
          <i className="bi bi-file-earmark-text me-2"></i>
          {t('vehicleHistoryReport')} (Optional)
        </h6>
      </div>

      <div className="col-md-6">
        <label className="form-label">Report Provider</label>
        <select
          className="form-select form-select-sm"
          value={formData.vehicleHistoryProvider || ''}
          onChange={(e) => onFormDataChange('vehicleHistoryProvider', e.target.value)}
        >
          <option value="">No Report</option>
          <option value="AutoCheck">AutoCheck</option>
          <option value="Carfax">Carfax</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="col-md-6">
        <label className="form-label">Report URL (Optional)</label>
        <input
          type="url"
          className="form-control form-control-sm"
          placeholder="https://www.carfax.com/..."
          value={formData.vehicleHistoryUrl || ''}
          onChange={(e) => onFormDataChange('vehicleHistoryUrl', e.target.value)}
        />
      </div>
    </>
  );
};
