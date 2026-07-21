
// export default function A () {
//   return (
    
//   )
// }



export default function Button(props) {
  return (
    <button type="button" class=" px-2 h-10 border   w-20 mr-2 mb-2 text-sm font-medium text-gray-900 bg-white ">
      <img className=" w-full" src={props.src} />
    </button>
  )

}