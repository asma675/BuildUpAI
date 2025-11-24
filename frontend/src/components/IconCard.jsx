const IconCard = ({ icon: Icon, title, children, className = "" }) => (
  <div
    className={`p-5 bg-gradient-to-br from-purple-900/80 via-purple-800/90 to-indigo-900/80 rounded-2xl shadow-xl border border-purple-500/40 backdrop-blur-xl ${className}`}
  >
    <div className="flex items-center text-cyan-300 mb-3">
      <Icon className="w-6 h-6 mr-3 drop-shadow-glow" />
      <h3 className="text-xl font-semibold text-purple-50">{title}</h3>
    </div>
    {children}
  </div>
);

export default IconCard;
