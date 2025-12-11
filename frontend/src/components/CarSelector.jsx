import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * CarSelector Component
 * Uses NHTSA Vehicle API to fetch car makes and models
 * Free API - No authentication required
 */
export const CarSelector = ({ manufacturer, model, year, onManufacturerChange, onModelChange, onYearChange }) => {
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Generate year options (current year to 1990)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  // Fetch car makes on component mount
  useEffect(() => {
    fetchMakes();
  }, []);

  // Fetch models when manufacturer or year changes
  useEffect(() => {
    if (manufacturer && year) {
      fetchModels(manufacturer, year);
    } else {
      setModels([]);
    }
  }, [manufacturer, year]);

  const fetchMakes = async () => {
    setLoadingMakes(true);
    try {
      const response = await axios.get(
        'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json'
      );

      if (response.data?.Results) {
        // Sort alphabetically
        const sortedMakes = response.data.Results
          .map(item => item.MakeName)
          .filter(Boolean)
          .sort();

        setMakes(sortedMakes);
      }
    } catch (error) {
      console.error('Error fetching car makes:', error);
      // Fallback to popular makes if API fails
      setMakes([
        'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
        'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar',
        'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz',
        'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota',
        'Volkswagen', 'Volvo'
      ]);
    } finally {
      setLoadingMakes(false);
    }
  };

  const fetchModels = async (make, modelYear) => {
    setLoadingModels(true);
    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${modelYear}?format=json`
      );

      if (response.data?.Results) {
        // Sort alphabetically
        const sortedModels = response.data.Results
          .map(item => item.Model_Name)
          .filter(Boolean)
          .sort();

        // Remove duplicates
        const uniqueModels = [...new Set(sortedModels)];
        setModels(uniqueModels);
      }
    } catch (error) {
      console.error('Error fetching car models:', error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleManufacturerChange = (e) => {
    const selectedMake = e.target.value;
    onManufacturerChange(selectedMake);
    // Clear model when manufacturer changes
    onModelChange('');
    setModels([]);
  };

  const handleYearChange = (e) => {
    const selectedYear = e.target.value;
    onYearChange(selectedYear);
    // Clear model when year changes
    onModelChange('');
  };

  return (
    <>
      {/* Year */}
      <div className="col-md-4">
        <div className="form-floating">
          <select
            className="form-select"
            id="year"
            name="year"
            value={year}
            onChange={handleYearChange}
          >
            <option value="">Select Year</option>
            {years.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
          <label htmlFor="year">Year</label>
        </div>
      </div>

      {/* Manufacturer/Make */}
      <div className="col-md-4">
        <div className="form-floating">
          <select
            className="form-select"
            id="manufacturer"
            name="manufacturer"
            value={manufacturer}
            onChange={handleManufacturerChange}
            disabled={loadingMakes}
          >
            <option value="">
              {loadingMakes ? 'Loading makes...' : 'Select Make'}
            </option>
            {makes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
          <label htmlFor="manufacturer">Manufacturer</label>
        </div>
      </div>

      {/* Model */}
      <div className="col-md-4">
        <div className="form-floating">
          <select
            className="form-select"
            id="model"
            name="model"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={!manufacturer || !year || loadingModels}
          >
            <option value="">
              {loadingModels
                ? 'Loading models...'
                : (!manufacturer || !year)
                  ? 'Select year & make first'
                  : models.length === 0
                    ? 'No models found'
                    : 'Select Model'
              }
            </option>
            {models.map(mdl => (
              <option key={mdl} value={mdl}>{mdl}</option>
            ))}
          </select>
          <label htmlFor="model">Model</label>
        </div>
        {manufacturer && year && !loadingModels && models.length === 0 && (
          <small className="text-muted">
            Can't find your model? You can type it manually after selecting.
          </small>
        )}
      </div>

      {/* Allow manual input if model not found */}
      {manufacturer && year && models.length === 0 && !loadingModels && (
        <div className="col-md-12">
          <div className="form-floating">
            <input
              type="text"
              className="form-control"
              id="modelManual"
              name="model"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder=" "
            />
            <label htmlFor="modelManual">Enter Model Manually</label>
          </div>
        </div>
      )}
    </>
  );
};
