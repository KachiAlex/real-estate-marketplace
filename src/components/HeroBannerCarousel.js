import React, { useState, useEffect } from 'react';
import RegisterModal from './auth/RegisterModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaShieldAlt, 
  FaArrowRight, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckCircle,
  FaLock,
  FaHandshake,
  FaCertificate
} from 'react-icons/fa';

const HeroBannerCarousel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const slides = [
    {
      id: 1,
      title: "Secure Real Estate Investing",
      subtitle: "Starts Here",
      description: "Nigeria's first secure property marketplace with escrow protection, verified listings, and transparent transactions.",
      buttonText: "Browse Properties",
      icon: FaShieldAlt,
      bgImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",
      bgColor: "from-blue-600 to-blue-800",
      iconColor: "text-yellow-300",
      highlightColor: "text-orange-400"
    },
    {
      id: 2,
      title: "100% Escrow Protected",
      subtitle: "Your Money is Safe",
      description: "Your funds are held securely in escrow until the transaction is complete. No risks, no fraud, guaranteed protection.",
      buttonText: "Learn More About Escrow",
      icon: FaLock,
      bgImage: "https://images.unsplash.com/photo-1568605117035-dff8e3e2ebde?w=1600&q=80",
      bgColor: "from-green-600 to-green-800",
      iconColor: "text-blue-200",
      highlightColor: "text-yellow-300"
    },
    {
      id: 3,
      title: "Verified Properties Only",
      subtitle: "No Fake Listings",
      description: "Every property undergoes rigorous verification. We confirm ownership, documents, and authenticity before listing.",
      buttonText: "Explore Verified Properties",
      icon: FaCertificate,
      bgImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80",
      bgColor: "from-purple-600 to-purple-800",
      iconColor: "text-pink-200",
      highlightColor: "text-green-300"
    },
    {
      id: 4,
      title: "Expert Dispute Resolution",
      subtitle: "We're Here to Help",
      description: "If something goes wrong, our expert team mediates disputes fairly. Transparent processes, quick resolution.",
      buttonText: "Start Investing Now",
      icon: FaHandshake,
      bgImage: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1600&q=80",
      bgColor: "from-orange-600 to-orange-800",
      iconColor: "text-white",
      highlightColor: "text-yellow-200"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearTimeout(timer);
  }, [currentSlide, isAutoPlaying, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="relative h-[500px] w-full overflow-hidden shadow-2xl">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${currentSlideData.bgImage})`,
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-1000 ease-in-out"></div>
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 -left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-8 sm:px-12 lg:px-20">
        <div className="w-full max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-black bg-opacity-40 rounded-full mb-6 border border-white border-opacity-50 animate-fade-in">
            <Icon className={`text-xl ${currentSlideData.iconColor}`} />
            <p className="text-white font-medium">{currentSlideData.title}</p>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-slide-up">
            {currentSlideData.title}
            <span className={`block ${currentSlideData.highlightColor} mt-2`}>
              {currentSlideData.subtitle}
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-white text-opacity-90 max-w-2xl mb-6 leading-relaxed animate-fade-in-delay">
            {currentSlideData.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-delay-2 justify-center">
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="group px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <span>Get Started</span>
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            {showRegisterModal && (
              <RegisterModal onClose={() => setShowRegisterModal(false)} />
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl animate-fade-in-delay-3">
            {['100% Secure', 'Verified', '24/7 Support', 'Dispute Resolution'].map((text, idx) => (
              <div key={idx} className="bg-black bg-opacity-40 p-3 rounded-lg border border-white border-opacity-50 hover:bg-opacity-60 transition-all">
                <div className="text-xl font-bold text-white mb-1">
                  {idx === 0 && '100%'}
                  {idx === 1 && <FaCheckCircle className="inline text-green-300" />}
                  {idx === 2 && '24/7'}
                  {idx === 3 && '∞'}
                </div>
                <div className="text-xs text-white text-opacity-90">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-300 shadow-lg"
        aria-label="Previous slide"
      >
        <FaChevronLeft className="text-xl" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all duration-300 shadow-lg"
        aria-label="Next slide"
      >
        <FaChevronRight className="text-xl" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'w-8 bg-white'
                : 'w-2 bg-white bg-opacity-40 hover:bg-opacity-60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20">
          <div 
            className="h-full bg-white transition-all linear"
            style={{ 
              animation: `progress ${5000}ms linear`,
              width: '100%'
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.4s both;
        }

        .animate-fade-in-delay-3 {
          animation: fade-in 1s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
};

export default HeroBannerCarousel;
