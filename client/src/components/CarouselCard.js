
import { useState } from 'react';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles 
import 'swiper/css';

export default function Carousel() {

  const [productData, setproductData] = useState(
    [
      {
        name: "Sekolah Dasar Hacktiv Mengadakan Lomba Membaca untuk Siswa",
        imgUrl: "https://www.hempfieldsd.org/cms/lib/PA01000122/Centricity/ModuleInstance/1972/large/RES2.jpg"
      },
      {
        name: "Siswa Sekolah Dasar Hacktiv Berhasil Membuat Proyek Sains Inovatif",
        imgUrl: "https://bekasi.binus.sch.id/wp-content/uploads/2019/11/B4A3845.jpg",
      },
      {
        name: "Sekolah Dasar Hacktiv Mengadakan Kegiatan Penanaman Pohon",
        imgUrl: "https://t3.ftcdn.net/jpg/01/69/11/36/360_F_169113679_K0f6Hk80VZL9J3Et5zdKyrAupl0bIKhS.jpg",
      },
      {
        name: "Siswa Sekolah Dasar Hacktiv Berpartisipasi dalam Program Donasi Buku",
        imgUrl: "https://t3.ftcdn.net/jpg/01/69/11/36/360_F_169113679_K0f6Hk80VZL9J3Et5zdKyrAupl0bIKhS.jpg",
      },
      {
        name: "Sekolah Dasar Hacktiv Mengadakan Program Keterampilan Hidup untuk Siswa",
        imgUrl: "https://www.stu.edu/news/wp-content/uploads/2020/01/ba-in-elementary-education.jpg",
      },



    ]
  )


  return (


    <div className=' mt-10 p-3 justify-center overflow-scroll max-w-screen-xl mx-auto  border-red-400' >

      <h5 class="text-xl font-semibold tracking-tight text-gray-900"> Berita </h5>


      <Swiper
        spaceBetween={50}
        slidesPerView={1}
        // onSlideChange={() => console.log('slide change')}
        // onSwiper={(swiper) => console.log(swiper)}
      >
        {productData.map((each, index) => {
          return (
            <SwiperSlide key={index} >
              <CardImage src={each.imgUrl} title={each.name} />
            </SwiperSlide>
          )
        })}

      </Swiper>
    </div>


  );
}


function CardImage(props) {
  return (

    <div class="max-w-sm m-auto p-3  bg-white border border-gray-200 rounded-lg shadow ">
      <a href="#" className='shadow-md'>
        <img class="rounded-lg " src={props.src} alt="" />
      </a>
      <div class="pt-3">
        <a href="#">
          <h5 class="mb-2 text-sm  font-bold tracking-tight text-gray-900 "> {props.title} </h5>
        </a>
        {/* <p class="mb-3 font-normal text-gray-700 dark:text-gray-400">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p> */}
        <a href="#" class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          Read more
          <svg aria-hidden="true" class="w-4 h-4 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </a>
      </div>
    </div>

  )
}