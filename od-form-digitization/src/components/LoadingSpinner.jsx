function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  let spinnerSize = '40px';
  
  if (size === 'small') {
    spinnerSize = '24px';
  } else if (size === 'large') {
    spinnerSize = '64px';
  }
  
  return (
    <div className="loading-spinner">
      <div className="spinner" style={{ width: spinnerSize, height: spinnerSize }}></div>
      {text && <p className="mt-2">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
