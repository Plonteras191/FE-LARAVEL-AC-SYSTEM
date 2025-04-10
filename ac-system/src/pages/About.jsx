import React from 'react';
import '../styles/About.css';
import myImage from "../assets/map.jpg";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-box">
        <h2>About Us</h2>
        <p>
        Welcome to ❄️ EER Aircon Services – your trusted partner in air conditioning solutions. We are dedicated to providing high-quality and reliable cooling services to both homes and businesses in our community,
         ensuring your comfort is always our top priority. With a commitment to excellence and customer satisfaction, we specialize in air conditioning installation, maintenance, repairs, and now offer convenient home service,
          delivering expert care right to your doorstep. Our team of skilled professionals is equipped with the expertise and experience to handle all types of air conditioning systems, ensuring optimal performance and energy efficiency for your complete peace of mind.
        </p>
        <div className="address-box">
          <div className="address-text">
            <h1>Our Address</h1>
            <p>
              Gemilina St.Zone 6.<br />
              Bugo<br />
              Cagayan De Oro City, 9000<br />
              Misamis Oriental
            </p>
          </div>
          <div className="address-image">
            {<img src={myImage} alt="Description" width="300" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
