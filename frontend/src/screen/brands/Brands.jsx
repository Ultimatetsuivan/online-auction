import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useNavigate } from "react-router-dom";

export const Brands = () => {
  const navigate = useNavigate();

  // Popular brands - can be fetched from API in the future
  const brands = [
    { name: "Apple", icon: "apple", description: "Premium technology products" },
    { name: "Samsung", icon: "phone", description: "Electronics and appliances" },
    { name: "Nike", icon: "shoe-prints", description: "Sports and athletic wear" },
    { name: "Adidas", icon: "shoe-prints", description: "Sports and lifestyle" },
    { name: "Sony", icon: "speaker", description: "Electronics and entertainment" },
    { name: "LG", icon: "tv", description: "Home electronics" },
    { name: "Dell", icon: "laptop", description: "Computers and accessories" },
    { name: "HP", icon: "printer", description: "Computing solutions" },
    { name: "Canon", icon: "camera", description: "Cameras and printers" },
    { name: "Nikon", icon: "camera", description: "Photography equipment" },
    { name: "Lenovo", icon: "laptop", description: "Computers and tablets" },
    { name: "Asus", icon: "desktop", description: "PC hardware" },
    { name: "Puma", icon: "shoe-prints", description: "Sports apparel" },
    { name: "Under Armour", icon: "tshirt", description: "Athletic gear" },
    { name: "Microsoft", icon: "xbox", description: "Software and hardware" },
    { name: "Huawei", icon: "phone", description: "Mobile devices" },
    { name: "Xiaomi", icon: "phone", description: "Smart devices" },
    { name: "Panasonic", icon: "speaker", description: "Consumer electronics" },
  ];

  const handleBrandClick = (brandName) => {
    navigate(`/allproduct?brand=${encodeURIComponent(brandName)}`);
  };

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-award me-2" style={{ color: '#FF6A00' }}></i>
            All Brands
          </h2>

          {/* Brands Grid */}
          <div className="row">
            {brands.map((brand, index) => (
              <div key={index} className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4">
                <div
                  className="card h-100 text-center p-3 hover-effect"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleBrandClick(brand.name)}
                >
                  <div className="mb-2">
                    <i
                      className={`bi bi-${brand.icon} fs-1`}
                      style={{ color: '#FF6A00' }}
                    ></i>
                  </div>
                  <h6 className="mb-1 fw-bold">{brand.name}</h6>
                  {brand.description && (
                    <p className="text-muted small mb-0">{brand.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Popular Brands Section */}
          <div className="mt-5">
            <h4 className="mb-3">
              <i className="bi bi-star me-2" style={{ color: '#FF6A00' }}></i>
              Popular Brands
            </h4>
            <div className="d-flex flex-wrap gap-2">
              {brands.slice(0, 10).map((brand, index) => (
                <button
                  key={index}
                  className="btn btn-outline-secondary"
                  onClick={() => handleBrandClick(brand.name)}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Browse by Category */}
          <div className="mt-5 p-4 bg-light rounded">
            <h5 className="mb-3">Looking for something specific?</h5>
            <p className="text-muted mb-3">
              Browse our categories to find products from your favorite brands
            </p>
            <button
              className="btn text-white"
              style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
              onClick={() => navigate('/categories')}
            >
              <i className="bi bi-grid-3x3-gap me-2"></i>
              Browse Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
