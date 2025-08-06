import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center">
          Video to MP3 Converter
        </h1>
        <p className="text-center text-blue-100 mt-2">
          Convert your video files to MP3 audio in the browser
        </p>
      </div>
    </header>
  );
};

export default Header;