import { useEffect, useState, useRef, Suspense } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useSelector, useDispatch } from 'react-redux';

import { fetchStudentDetail, fetchClassmate } from '../store/actions/actionCreator';

import ScrollReveal from 'scrollreveal';

import { Button } from 'flowbite-react';

import Card from '../components/Card';
import Carousel from '../components/Carousel';
import CtaButton from '../components/buttons/cta-button';
import Top from '../components/Top';
import HeatMap from '../components/HeatmapChart';
import HeatmapDua from '../components/HeatmapChartDua';
import BubbleChart from '../components/BubbleChart';
import TableDetail from '../components/TableDetailNilai';
import ScheduleList from '../components/ScheduleList';
import CarouselCard from '../components/CarouselCard';
import TimelineChart from '../components/TimelineChart';
import FellowFriend from '../components/FellowFriends';
import Loading from '../components/Loading';

// import "../../style/custom.css"

export default function Home() {
  // const {
  //   product: { productById, error, loading },
  //   category,
  // } = useSelector((state) => state);

  const {
    student: { studentDetail, classmate, loading, error },
  } = useSelector((state) => state);

  // const { Attendances } = productById;

  // console.log(classmate, "lashem");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoad, setIsLoad] = useState(true);
  //   const [categories, setCategories] = useState([]);

  const bottom = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const top = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  function reveal(ref, origin = 'bottom') {
    return ScrollReveal().reveal(ref.current, {
      distance: '20px',
      origin: origin,
      opacity: 0,
      duration: 2000,
    });
  }

  const homeContainer = document.querySelector('.homeContainer');
  let isHidden;
  useEffect(() => {
    isHidden = 'none';
    dispatch(fetchStudentDetail())
      .then(() => {
        return dispatch(fetchClassmate());
      })
      .then(() => {
        bottom.forEach((each) => reveal(each));

        top.forEach((each) => reveal(each, 'top'));
        setIsLoad(false);
        isHidden = 'block';
      });
  }, []);

  const [arrColor, setArrColor] = useState({});

  const [productData, setproductData] = useState([
    {
      id: 9,
      Top: 'Upright Collar Line Cotton Linen Shirt',
      slug: 'upright-collar-line-cotton-linen-shirt',
      description: "Men's Shirt with updated material. It is soft cool, and comfortable to wear. Koko clothes with contemporary fashionable designs",
      price: 499000,
      mainImg: 'https://image.uniqlo.com/UQ/ST3/id/imagesgoods/457429/item/idgoods_66_457429.jpg?width=750',
      CategoryId: 6,
      TypeId: 1,
      AuthorId: 1,
      createdAt: '2023-02-20T23:07:21.959Z',
      updatedAt: '2023-02-20T23:07:21.959Z',
      User: {
        email: 'macnesa@gmail.com',
      },
      Category: {
        name: 'Casual Shirt (Long Sleeves)',
      },
      Type: {
        name: 'Men',
      },
    },
    {
      id: 10,
      name: 'Upright Collar Cotton Linen Shirt',
      slug: 'upright-collar-cotton-linen-shirt',
      description: "Men's shirt with renewed material so that it feels soft, cool, and comfortable to wear. Koko clothes with contemporary fashionable designs",
      price: 499000,
      mainImg: 'https://image.uniqlo.com/UQ/ST3/id/imagesgoods/455966/item/idgoods_56_455966.jpg?width=750',
      CategoryId: 6,
      TypeId: 1,
      AuthorId: 1,
      createdAt: '2023-02-20T23:07:21.959Z',
      updatedAt: '2023-02-20T23:07:21.959Z',
      User: {
        email: 'macnesa@gmail.com',
      },
      Category: {
        name: 'Casual Shirt (Long Sleeves)',
      },
      Type: {
        name: 'Men',
      },
    },
    {
      id: 7,
      name: 'Uniqlo U 3/4 Sleeve Round Collar T-Shirt',
      slug: 'uniqlo-u-3/4-sleeve-round-collar-t-shirt',
      description: "Men's T-shirt of 100% soft cotton material. Wide cut with pocket accents on the chest.",
      price: 299000,
      mainImg: 'https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/456972/sub/goods_456972_sub11.jpg?width=750',
      CategoryId: 5,
      TypeId: 1,
      AuthorId: 1,
      createdAt: '2023-02-20T23:07:21.959Z',
      updatedAt: '2023-02-20T23:07:21.959Z',
      User: {
        email: 'macnesa@gmail.com',
      },
      Category: {
        name: 'T-Shirt',
      },
      Type: {
        name: 'Men',
      },
    },
    {
      id: 8,
      name: 'Long Sleeve Line T-Shirt',
      slug: 'long-sleeve-line-t-shirt',
      description: 'T-shirt line made of 100% cotton. With a unique retro style',
      price: 299000,
      mainImg: 'https://image.uniqlo.com/UQ/ST3/id/imagesgoods/455406/item/idgoods_69_455406.jpg?width=750',
      CategoryId: 5,
      TypeId: 1,
      AuthorId: 1,
      createdAt: '2023-02-20T23:07:21.959Z',
      updatedAt: '2023-02-20T23:07:21.959Z',
      User: {
        email: 'macnesa@gmail.com',
      },
      Category: {
        name: 'T-Shirt',
      },
      Type: {
        name: 'Men',
      },
    },
    {
      id: 6,
      name: 'Round Collar Washable Cotton Sweater',
      slug: 'round-collar-washable-cotton-sweater',
      description: "Men's Sweater with elegant texture and color, with stylish cut and sleek fit.",
      price: 399000,
      mainImg: 'https://image.uniqlo.com/UQ/ST3/id/imagesgoods/453760/item/idgoods_43_453760.jpg?width=750',
      CategoryId: 4,
      TypeId: 1,
      AuthorId: 1,
      createdAt: '2023-02-20T23:07:21.959Z',
      updatedAt: '2023-02-20T23:07:21.959Z',
      User: {
        email: 'macnesa@gmail.com',
      },
      Category: {
        name: 'Sweaters & Cardigans',
      },
      Type: {
        name: 'Men',
      },
    },
    {
      id: 5,
      name: 'U Single Breasted Oversize Coat',
      slug: 'u-single-breasted-oversize-coat',
      description: 'An oversize coat that goes well with any top. Perfect for cold weather.',
      price: 690000,
      mainImg: 'https://image.uniqlo.com/UQ/ST3/id/imagesgoods/457988/sub/idgoods_457988_sub1.jpg?width=750',
      CategoryId: 3,
      TypeId: 1,
      AuthorId: 1,
      createdAt: '2023-02-20T23:07:21.959Z',
      updatedAt: '2023-02-20T23:07:21.959Z',
      User: {
        email: 'macnesa@gmail.com',
      },
      Category: {
        name: 'Coat',
      },
      Type: {
        name: 'Men',
      },
    },
  ]);

  if (isLoad) {
    return <Loading />;
  }

  if (error) {
    return <p>Error</p>;
  }

  return (
    <div style={{ display: isHidden }} className=" mb-32 ">
      {/* <ChatPage/> */}

      {/* <div className='w-full h-[40vh] bg-primary2-100  '> 
      </div> */}

      <div className="w-full p-2 pt-10    grid justify-center pb-10  gap-6 ">
        <h5 ref={top[0]} class="text-xl  font-bold tracking-tight text-gray-900 dark:text-white">
          ISSA
        </h5>

        {/* <div id="toast-notification" class="w-full justify-self-start   mx-auto max-w-xs p-4 m-3 border border-red-800 text-gray-900 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-300" role="alert">

          <div class="flex items-center">
            <div class="relative inline-block shrink-0">
              <img class="w-12 h-12 rounded-full" src="https://i.servimg.com/u/f42/19/69/61/77/201918.jpg" alt="Jese Leos image" />
              <span class="absolute bottom-0 right-0 inline-flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                <svg aria-hidden="true" class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                <span class="sr-only">Message icon</span>
              </span>
            </div>
            <div class="ml-3 text-sm font-normal">
              <div class="text-sm font-semibold text-gray-900 dark:text-white">Bonnie Green</div>
              <div class="text-sm font-normal">I just wanna make it</div>
              <span class="text-xs font-medium text-blue-600 dark:text-blue-500">a few seconds ago</span>
            </div>
          </div>


        </div> */}

        <div className="grid  grid-cols-[1fr_1fr] gap-4 ">
          <Link to="attendance">
            <HomeCard
              title="Kehadiran"
              ionIcon="archive"
              backgroundColor="#c7e1eb"
              color="#e0d9ff"
              fontColor="#e0d9ff"
              backgroundImage="https://static.vecteezy.com/system/resources/previews/003/126/110/non_2x/abstract-blue-gradient-radial-background-with-square-pattern-texture-vector.jpg"
            />
          </Link>

          <Link to="total">
            <HomeCard title="Trafik Nilai" ionIcon="bar-chart" color="#6bbfbc" backgroundImage="https://img.freepik.com/free-vector/white-abstract-background_23-2148810113.jpg" borderColor="#96e3b7" fontColor="#857a80" />
          </Link>

          <Link to="lesson">
            <HomeCard title="Mata Pelajaran" ionIcon="reader" color="#f2e291" fontColor="#fddbff" backgroundImage="https://img.freepik.com/premium-photo/modern-background_102121-59.jpg" />
          </Link>

          <Link to="event">
            <HomeCard
              title={'Jadwal '}
              ionIcon="person"
              color="white"
              boxShadow="-10px 9px 28px -4px rgba(149,85,194,0.33)"
              reveal="top"
              backgroundImage="https://cdn.dribbble.com/users/1995480/screenshots/7391446/media/9f831f268b6098e5901c493ba8aa4568.jpg?compress=1&resize=400x300&vertical=top"
              fontColor="#d8db97"
            />
          </Link>
        </div>
      </div>

      <Top data={studentDetail} />

      <FellowFriend data={classmate} />

      {/* <CarouselCard /> */}

      {/* <div ref={bottom[2]} >
        <HeatmapDua data={Attendances} />
      </div> */}

      {/*       
      <div ref={bottom[0]}>
        <TimelineChart  />
      </div> */}

      {/* <HeatMap /> */}

      {/* <BubbleChart /> */}

      {/* <Carousel /> */}
    </div>
  );
}

function HomeCard(props) {
  const { color, borderColor, backgroundColor, backgroundImage, fontColor, boxShadow, reveal } = props;

  const [ionStyle, setIonStyle] = useState(` text-[${color}] text-2xl  `);

  const identifier = useRef(null);

  useEffect(() => {
    ScrollReveal().reveal(identifier.current, {
      distance: '20px',
      origin: reveal,
      opacity: 0,
      duration: 2000,
    });
  }, []);

  return (
    <div
      style={{
        boxShadow: boxShadow,
        // backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        backgroundImage: `url(${backgroundImage})`,
      }}
      class="max-w-sm px-4 py-6  bg-white  rounded-2xl  "
      ref={identifier}
    >
      <ion-icon name={props.ionIcon} style={{ color: color, fontSize: '35px' }} className=" text-[20em] "></ion-icon>

      <a href="#">
        <h5 style={{ color: fontColor }} className="mt-2 font-semibold tracking-tight">
          {' '}
          {props.title}{' '}
        </h5>
      </a>
      <p class=" text-sm font-normal text-gray-500 dark:text-gray-400">{/* <ion-icon name="log-out-outline" style={{color: "gray"}} className="text-blue-400" ></ion-icon> */}</p>
      {/* <a href="#" class="inline-flex items-center text-blue-600 hover:underline">

        <svg class="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
      </a> */}
    </div>
  );
}
