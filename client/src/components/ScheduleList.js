



export default function ScheduleList(props) {
  const {data} = props
  const day  = Object.keys(data)
  return (
    <ul class="w-28 text-sm font-medium mx-auto text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
      <a style={{backgroundImage: "url(https://e0.pxfuel.com/wallpapers/206/763/desktop-wallpaper-simple-black-clean-dark.jpg)"}} href="#" aria-current="true" class="block w-full px-4 py-2 text-white bg-blue-700 border-b border-gray-200 rounded-t-lg cursor-pointer dark:bg-gray-800 dark:border-gray-600">
        {day} 
      </a>
      {data[day].map((each, index) => {
        return(
          <EachList key={index}  innerHTML={each} /> 
        )
      })} 
    </ul>
  )
}

function EachList(props){
  return(
    <li class="w-full px-4 py-2 border-b border-gray-200 dark:border-gray-600"> {props.innerHTML} </li>
  )
}

