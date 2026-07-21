import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay } from 'swiper';
// import 'swiper/swiper-bundle.css';
import { useState } from 'react';
// import './newsline.css';  
import 'swiper/css';
SwiperCore.use([Autoplay]);

export default function Carousel() {

  const [productData, setproductData] = useState(
    [
      "https://www.hempfieldsd.org/cms/lib/PA01000122/Centricity/ModuleInstance/1972/large/RES2.jpg",
      "https://bekasi.binus.sch.id/wp-content/uploads/2019/11/B4A3845.jpg",
      "https://t3.ftcdn.net/jpg/01/69/11/36/360_F_169113679_K0f6Hk80VZL9J3Et5zdKyrAupl0bIKhS.jpg",
      "https://www.stu.edu/news/wp-content/uploads/2020/01/ba-in-elementary-education.jpg"
    ]
  )


  return (
    <div className='grid mt-4 justify-center max-w-screen-xl mx-auto border border-red-400' >
      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        slidesPerView={'auto'}
        loop={true}
        className="swiper-newsline"
      >
        {/* <div className="swiper-wrapper"> */}

        {productData.map(each => {
          return (
            <SwiperSlide>
              <img src={each} className="w-full" />
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  );
}
