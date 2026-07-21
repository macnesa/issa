import { useEffect, useState, useRef } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useSelector, useDispatch } from "react-redux"
import { getProducts } from '../store/actions/actionCreator';

import ScrollReveal from 'scrollreveal';
import { Button } from "flowbite-react"

import Card from '../components/Card';
import Carousel from '../components/Carousel';
import CtaButton from '../components/buttons/cta-button'
import Footer from '../components/Footer';
import Top from './home/components/Top';
import HeatMap from './components/HeatmapChart';
import HeatmapDua from './components/HeatmapChartDua';
import LineChart from './components/LineChart';
import BubbleChart from '../components/BubbleChart';
import TableDetail from './components/TableDetailNilai';
import LessonsList from './LessonsList';


import BubbleChartDua from './components/BubbleChartDua';


import "../../style/custom.css"

















export default function Home() {

  const { product: { allProduct, productById }, category } = useSelector((state) => state)


  const navigate = useNavigate()
  const dispatch = useDispatch()
  console.log(allProduct);

  //   const [products, setProducts] = useState([]);
  //   const [categories, setCategories] = useState([]);

  ScrollReveal().reveal('.reveal_top',
    {
      distance: '20px',
      origin: 'top',
      duration: 2000
    }

  )
  ScrollReveal().reveal('.reveal_bottom',
    {
      distance: '20px',
      origin: 'bottom',
      duration: 2000
    }

  )


  useEffect(() => {
    dispatch(getProducts())
    ScrollReveal().reveal('.reveal',
      {
        distance: '20px',
        origin: 'bottom',
        opacity: 0,
        delay: 1000,
        duration: 2000
      }
    );
  }, []);


  const [arrColor, setArrColor] = useState({})

  const [productData, setproductData] = useState(
    [
      {
        id: 9,
        Top: "Upright Collar Line Cotton Linen Shirt",
        slug: "upright-collar-line-cotton-linen-shirt",
        description: "Men's Shirt with updated material. It is soft cool, and comfortable to wear. Koko clothes with contemporary fashionable designs",
        price: 499000,
        mainImg: "https://image.uniqlo.com/UQ/ST3/id/imagesgoods/457429/item/idgoods_66_457429.jpg?width=750",
        CategoryId: 6,
        TypeId: 1,
        AuthorId: 1,
        createdAt: "2023-02-20T23:07:21.959Z",
        updatedAt: "2023-02-20T23:07:21.959Z",
        User: {
          email: "macnesa@gmail.com"
        },
        Category: {
          name: "Casual Shirt (Long Sleeves)"
        },
        Type: {
          name: "Men"
        }
      }, {
        "id": 10,
        "name": "Upright Collar Cotton Linen Shirt",
        "slug": "upright-collar-cotton-linen-shirt",
        "description": "Men's shirt with renewed material so that it feels soft, cool, and comfortable to wear. Koko clothes with contemporary fashionable designs",
        "price": 499000,
        "mainImg": "https://image.uniqlo.com/UQ/ST3/id/imagesgoods/455966/item/idgoods_56_455966.jpg?width=750",
        "CategoryId": 6,
        "TypeId": 1,
        "AuthorId": 1,
        "createdAt": "2023-02-20T23:07:21.959Z",
        "updatedAt": "2023-02-20T23:07:21.959Z",
        "User": {
          "email": "macnesa@gmail.com"
        },
        "Category": {
          "name": "Casual Shirt (Long Sleeves)"
        },
        "Type": {
          "name": "Men"
        }
      },
      {
        "id": 7,
        "name": "Uniqlo U 3/4 Sleeve Round Collar T-Shirt",
        "slug": "uniqlo-u-3/4-sleeve-round-collar-t-shirt",
        "description": "Men's T-shirt of 100% soft cotton material. Wide cut with pocket accents on the chest.",
        "price": 299000,
        "mainImg": "https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/456972/sub/goods_456972_sub11.jpg?width=750",
        "CategoryId": 5,
        "TypeId": 1,
        "AuthorId": 1,
        "createdAt": "2023-02-20T23:07:21.959Z",
        "updatedAt": "2023-02-20T23:07:21.959Z",
        "User": {
          "email": "macnesa@gmail.com"
        },
        "Category": {
          "name": "T-Shirt"
        },
        "Type": {
          "name": "Men"
        }
      },
      {
        "id": 8,
        "name": "Long Sleeve Line T-Shirt",
        "slug": "long-sleeve-line-t-shirt",
        "description": "T-shirt line made of 100% cotton. With a unique retro style",
        "price": 299000,
        "mainImg": "https://image.uniqlo.com/UQ/ST3/id/imagesgoods/455406/item/idgoods_69_455406.jpg?width=750",
        "CategoryId": 5,
        "TypeId": 1,
        "AuthorId": 1,
        "createdAt": "2023-02-20T23:07:21.959Z",
        "updatedAt": "2023-02-20T23:07:21.959Z",
        "User": {
          "email": "macnesa@gmail.com"
        },
        "Category": {
          "name": "T-Shirt"
        },
        "Type": {
          "name": "Men"
        }
      },
      {
        "id": 6,
        "name": "Round Collar Washable Cotton Sweater",
        "slug": "round-collar-washable-cotton-sweater",
        "description": "Men's Sweater with elegant texture and color, with stylish cut and sleek fit.",
        "price": 399000,
        "mainImg": "https://image.uniqlo.com/UQ/ST3/id/imagesgoods/453760/item/idgoods_43_453760.jpg?width=750",
        "CategoryId": 4,
        "TypeId": 1,
        "AuthorId": 1,
        "createdAt": "2023-02-20T23:07:21.959Z",
        "updatedAt": "2023-02-20T23:07:21.959Z",
        "User": {
          "email": "macnesa@gmail.com"
        },
        "Category": {
          "name": "Sweaters & Cardigans"
        },
        "Type": {
          "name": "Men"
        }
      },
      {
        "id": 5,
        "name": "U Single Breasted Oversize Coat",
        "slug": "u-single-breasted-oversize-coat",
        "description": "An oversize coat that goes well with any top. Perfect for cold weather.",
        "price": 690000,
        "mainImg": "https://image.uniqlo.com/UQ/ST3/id/imagesgoods/457988/sub/idgoods_457988_sub1.jpg?width=750",
        "CategoryId": 3,
        "TypeId": 1,
        "AuthorId": 1,
        "createdAt": "2023-02-20T23:07:21.959Z",
        "updatedAt": "2023-02-20T23:07:21.959Z",
        "User": {
          "email": "macnesa@gmail.com"
        },
        "Category": {
          "name": "Coat"
        },
        "Type": {
          "name": "Men"
        }
      },
    ]
  )




  return (
    <>

      {/* <div class="skeleton"></div>   */}


      <Top />

      <HeatMap />

      <HeatmapDua />

      <LineChart />

      <BubbleChart />

      <BubbleChartDua />

      <TableDetail />

      <LessonsList />


        
        {/* 
      ul{
            width:80%;
            margin:auto;
            border:10px solid rgb(73, 55, 107);
            list-style: none;
            display:grid;
            grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
            grid-gap:3px;
        } */} 
         
    


      {/* <div className=" w-[100%]   overflow-hidden box-border ">
        <div className=" h-[100%] ">
          <div className=" | grid"> 
            <video class="dch-video-item__player" data-video-id="6319345330112" data-small-video-id="6319346093112" data-account="1268729919001" data-policy-key="BCpkADawqM1Y866RZKo_d_lZ4BO9M5xFUuhau1_xn-o1cf_aGAKtoqQqehi8CoaMEgTW7OBrgrangdSnSau7mVrQdX377XADeXy_Rv1gTn6IVRadSBXPGBsZLLDNBJtHjELhRuV_VDmeUk7D" preload="metadata" muted autoPlay playsInline loop className="w-full row-start-1 col-start-1">
              <source src="https://house-fastly-signed-eu-west-1-prod.brightcovecdn.com/media/v1/pmp4/static/clear/1268729919001/92bffd6e-10ce-462b-a2ea-b909a784267d/273beb58-f38d-4362-ad64-7e88e76c481c/main.mp4?fastly_token=NjVkNTQxMmJfZDAzZmI2YjZkM2IwNTE4YzA0ZmJlODRjYWNjMDgyMDUwNzAzMGI1ZWJkOGQwNmMyMTA2ZjgyNjAwMGMyMmRiNV8vL2hvdXNlLWZhc3RseS1zaWduZWQtZXUtd2VzdC0xLXByb2QuYnJpZ2h0Y292ZWNkbi5jb20vbWVkaWEvdjEvcG1wNC9zdGF0aWMvY2xlYXIvMTI2ODcyOTkxOTAwMS85MmJmZmQ2ZS0xMGNlLTQ2MmItYTJlYS1iOTA5YTc4NDI2N2QvMjczYmViNTgtZjM4ZC00MzYyLWFkNjQtN2U4OGU3NmM0ODFjL21haW4ubXA0" type="video/mp4" className='' />
            </video>
            <div className=" font-raleway   grid justify-center  items-center text-white border-white row-start-1 col-start-1">
              <p className=" reveal font-raleway   text-6xl tracking-widest"> <span className=" font-raleway  bold-animation font-bold ">wear</span> your confidence</p>

            </div>
          </div>
        </div>
      </div> */}

      {/* <div className=" max-w-screen-xl mx-auto box-border  border-black grid ">
        <img className='row-start-1 col-start-1' src='https://images.hugoboss.com/is/image/hugobossdm/230213_B_MW_Suit_1920x880?%24large%24&fmt=webp&align=0,-1&fit=crop,1&ts=1676394980832&qlt=80&wid=1440&hei=660 ' />

        <div className='text-white row-start-1  border-white col-start-1 grid items-center justify-end pr-[12%] '>
          <div className=" reveal_top font-raleway font-bold text-right leading-[1em]  text-7xl tracking-widest">BE BOLD<br /> BE BEAUTIFUL <br /> BE MACLO <br />
            <div className=" reveal_bottom text-sm mt-5 ">
              <Link to="/men">
                <CtaButton />
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      {/* <div className="mt-20 p-10 max-w-screen-xl mx-auto   box-bordergrid grid-rows-[max-content_1fr] grid-cols-1   ">
        <p className=' font-raleway  text-center font-bold text-xl'>man or kid</p>
        <p className=' font-raleway  text-center font-bold tracking-widest text-3xl'>PICK YOURS</p>
        <div className='grid   gap-5  mt-6  lg:grid-cols-[1fr_1fr] md:grid-cols-none  '>
          <div className='shadow-2xl  grid'>
            <img className='  row-start-1 col-start-1' src="https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/456972/sub/goods_456972_sub11.jpg?width=750" />
            <div className='row-start-1 col-start-1 grid items-end pl-10 pb-20'>
              <div>
                <p className='brightness-100 font-raleway font-bold  leading-[1em] text-white text-4xl tracking-widest'>TAKE THE<br /> ATTENTION</p>
                <div className="text-sm mt-5 ">
                  <CtaButton />
                </div>
              </div>
            </div>
          </div>
          <div className=' grid'>
            <img className='row-start-1 brightness-[.7] col-start-1' src="https://image.uniqlo.com/UQ/ST3/id/imagesgoods/454365/item/idgoods_44_454365.jpg?width=750" />
            <div className='row-start-1 col-start-1 grid items-end pl-10 pb-20'>
              <div>
                <p className='brightness-100 font-raleway font-bold  leading-[1em]  text-white text-4xl tracking-widest'>CHASE THE <br /> DREAMS</p>
                <div className="text-sm mt-5 ">
                  <Link to="/kid">
                    <CtaButton />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* <div className=" max-w-screen-xl mx-auto   box-border border border-black grid ">
        <img className='row-start-1 col-start-1' src='https://im.uniqlo.com/global-cms/spa/resb4b1555f22e6f1b9116f43bdf115ba5ffr.jpg' />

        <div className='text-white row-start-1 border border-white col-start-1 grid items-center pl-[12%] '>
          <div className="">
            <p className='reveal_bottom font-raleway font-bold  leading-[1em]  text-7xl tracking-widest'>Don't miss out on our limited flash sale</p>
            <div className="text-sm mt-5 ">
              <CtaButton />
            </div>
          </div>
        </div>
      </div> */}






      <Carousel data={productData} />



    </>

  );
}








































// // export default App;
// // import { useEffect, useState } from 'react';

// // import logo from './logo.svg';
// // import './App.css';
// // import Header from "./components/Header"

// // export default function App() {

// //   const [formValue, setformValue] = useState(
// //     {
// //       name: 'chaimGreen',
// //       password: 'i am ',
// //       username: 'twin'
// //     }
// //   )

// //   function updateForm(event) {
// //     const { name, value } = event.target;
// //     setformValue({ ...formValue, [name]: value });
// //     // const { name, value } = event.target

// //     // let plain = {
// //     //   ...formValue,
// //     // }
// //     // plain[name] = value
// //     // setformValue(plain)
// //   }

// //   useEffect(() => {
// //     console.log('tagidi');
// //   })

// //   return (
// //     <div className="App">
// //       <Header innerHTML="i love chaim green" />
// //       <header className="App-header" style={{ border: "1px solid white", boxSizing: "border-box" }} >
// //         <img src={logo} className="App-logo" alt="logo" />
// //         <p>
// //           Edit <code>src/App.js</code> and done
// //         </p>
// //         <a
// //           className="App-link"
// //           href="https://reactjs.org"
// //           target="_blank"
// //           rel="noopener noreferrer"
// //         >
// //           Learn React
// //         </a>
// //         <form>
// //           {/* <input type="text" value={formValue.name} onChange={function () { }} /> */}
// //           <input name="name" type="text" value={formValue.name} onChange={updateForm} />
// //           <input name="password" type="text" value={formValue.password} onChange={updateForm} />
// //           <input name="username" value={formValue.username} onChange={updateForm} />
// //         </form>
// //       </header>
// //     </div >
// //   );
// // }

// // export default App;
