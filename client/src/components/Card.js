



export default function Card(props) {
  return (
    <div className=" duration-200 delay-700 w-[150px] h-[200px] shadow-sm cursor-pointer | grid items-center ">
      <div className=" h-[100%] w-[100%]  row-start-1 col-start-1 overflow-hidden  rounded-lg  ">
        <img src={props.src} className="h-[100%] w-[100%] duration-200 " />
      </div>
    </div>
  )
}