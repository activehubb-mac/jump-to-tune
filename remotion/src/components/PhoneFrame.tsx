import React from "react";

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        width: 900,
        height: 1800,
        borderRadius: 80,
        border: "6px solid rgba(184,166,117,0.4)",
        background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 60px 120px rgba(0,0,0,0.8), 0 0 80px rgba(184,166,117,0.1)",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 50,
          borderRadius: 30,
          background: "#000",
          zIndex: 10,
        }}
      />
      <div style={{ padding: "90px 40px 40px", height: "100%", boxSizing: "border-box" }}>
        {children}
      </div>
    </div>
  );
};
