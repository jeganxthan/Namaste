import React, {useState} from 'react'
import {Eye, EyeClosed} from 'lucide-react'
const Input = ({
    value,
    onChange,
    label,
    placeholder,
    type
}) => {
    const[showPassword, setShowPassword] = useState(false)
    const toggleShowPassword = () =>{
        setShowPassword(!showPassword);
    }
  return (
    <div>
        <label>{label}</label>
        <div className='relative w-full'>
        <input type={type==="password" && showPassword ? "text":type} placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="md:w-[400px] w-[230px] lg:w-[400px] xl1:w-[450px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mt-2 ml:w-[300px] text-black"/>

        {type==="password" &&(
            <div className='absolute inset-y-0 right-4 flex items-center cursor-pointer top-2' onClick={toggleShowPassword}>
                {showPassword ? (
                    <Eye size={20}/>
                ):(
                    <EyeClosed/>
                )}
            </div>
        )}
        </div>
    </div>
  )
}

export default Input