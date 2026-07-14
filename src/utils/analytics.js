const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;

const sendPageView = () => {
  if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    page_title: document.title,
  });
};

export const initializeAnalytics = () => {
  if (!measurementId || typeof window === 'undefined' || document.getElementById('propertyark-ga')) return;

  const script = document.createElement('script');
  script.id = 'propertyark-ga';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  sendPageView();
  window.addEventListener('hashchange', sendPageView);
};

export const reportWebVital = (metric) => {
  if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true,
  });
};
