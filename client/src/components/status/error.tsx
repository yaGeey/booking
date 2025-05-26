export default function ErrorPopup({ message }: { message: string }) {
   return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50">
         <div className="bg-red-500 text-white p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Error</h2>
            <p>{message}</p>
         </div>
      </div>
   )
}
