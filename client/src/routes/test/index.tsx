import { Button } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import Picker, { type EmojiClickData } from 'emoji-picker-react'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/test/')({
   component: RouteComponent,
})

function RouteComponent() {
   const [isPickerVisible, setIsPickerVisible] = useState(false)
   const pickerRef = useRef<HTMLDivElement>(null)

   function handleEmojiClick(emoji: EmojiClickData) {
      console.log(emoji)
      setIsPickerVisible(false)
   }

   useEffect(() => {
      if (isPickerVisible && pickerRef.current) {
         const picker = pickerRef.current
         const rect = picker.getBoundingClientRect()
         console.log(rect, window.innerHeight)

         // Перевіряємо, чи виходить Picker за межі viewport
         if (rect.bottom > window.innerHeight) {
            picker.style.bottom = `0px` // Зміщуємо вгору
            console.log(picker.getBoundingClientRect())
         }
         if (rect.right > window.innerWidth) {
            picker.style.left = `${window.innerWidth - rect.width - 10}px` // Зміщуємо вліво
         }
      }
   }, [isPickerVisible])

   return (
      <div>
         <h1 className="text-3xl font-bold underline">Hello world!</h1>
         <div className="relative top-100 left-40">
            <Button onClick={() => setIsPickerVisible((p) => !p)}>Emoji</Button>
            {isPickerVisible && (
               <div
                  ref={pickerRef}
                  // className="absolute top-0 left-0"
               >
                  <Picker onEmojiClick={handleEmojiClick} previewConfig={{ showPreview: false }} />
               </div>
            )}
         </div>
      </div>
   )
}
