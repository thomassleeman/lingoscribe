"use client";

import React, { useState, useRef, useEffect } from "react";
//jotai
import { useAtom } from "jotai";
import { selectedTextAtom, chatMessagesAtom, ChatMessage } from "@/state/store";
import { ENDPOINTS } from "@/lib/apiConfig";
import SelectedText from "./SelectedText";
import ConfirmModal from "./ConfirmModal";
import type { Database } from "@/types/database.types";

import { PaperAirplaneIcon, TrashIcon } from "@heroicons/react/24/outline";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface ChatInterfaceProps {
  transcript: Transcript | null;
}

const ChatInterface = ({ transcript }: ChatInterfaceProps) => {
  const [selectedText, setSelectedText] = useAtom(selectedTextAtom);
  const [allMessages, setAllMessages] = useAtom(chatMessagesAtom);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter messages for the current transcript only
  const transcriptId = transcript?.id;
  const messages = allMessages.filter(
    (msg) => msg.transcriptId === transcriptId
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Prevent zoom on iOS
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventFontSizeAdjust = () => {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (!metaViewport) {
        const meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content =
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0";
        document.head.appendChild(meta);
      }
    };

    const handleFocus = () => {
      // Scroll input into view
      if (inputRef.current) {
        inputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    document.addEventListener("touchmove", preventZoom, { passive: false });

    preventFontSizeAdjust();

    // Add focus event listener to input
    const currentInput = inputRef.current;
    if (currentInput) {
      currentInput.addEventListener("focus", handleFocus);
    }

    return () => {
      document.removeEventListener("touchmove", preventZoom);
      if (currentInput) {
        currentInput.removeEventListener("focus", handleFocus);
      }
    };
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !input.trim() ||
      isLoading ||
      !transcript?.id ||
      !transcript?.transcript
    )
      return;

    setIsLoading(true);

    // Add selected text to the user's message if it exists
    const userContent = selectedText ? `("${selectedText}") ${input}` : input;

    // Create new message with transcript ID
    const newMessage: ChatMessage = {
      role: "user",
      content: userContent,
      transcriptId: transcript.id,
    };

    // Add to all messages
    const updatedMessages = [...allMessages, newMessage];
    setAllMessages(updatedMessages);
    setInput("");

    // Clear the selected text after using it
    if (selectedText) setSelectedText("");

    try {
      const response = await fetch(ENDPOINTS.CHAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcript.transcript,
          user_message: input,
          selected_text: selectedText,
        }),
      });
      const data = await response.json();

      console.log("Server response:", data);

      // Add assistant response with same transcript ID
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        transcriptId: transcript.id,
      };

      setAllMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message with transcript ID
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        transcriptId: transcript.id,
      };

      setAllMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmClear = () => {
    // Only remove messages for the current transcript
    const otherMessages = allMessages.filter(
      (msg) => msg.transcriptId !== transcript?.id
    );
    setAllMessages(otherMessages);
    setIsConfirmModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="z-10 relative mb-1 px-4 pt-2">
        <div className="z-20">
          <SelectedText />
        </div>
        <button
          onClick={clearChat}
          className="-z-10 absolute bg-white rounded-2xl py-1 px-2 dark:bg-slate-800 top-1 right-1 flex items-center text-gray-500 hover:text-red-500 text-sm font-medium focus:outline-none transition-colors duration-200"
          title="Clear chat history"
        >
          <TrashIcon className="w-4 h-4 mr-1" />
          Clear chat
        </button>
      </div>

      {/* Chat messages area */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`flex items-start max-w-[70%] ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`p-4 w-10 h-10 rounded-full inline-flex items-center justify-center text-white ${
                  msg.role === "user" ? "bg-rose-400 ml-2" : "bg-sky-600 mr-2"
                }`}
              >
                {msg.role === "user" ? (
                  "U"
                ) : (
                  <p className="text-lg">
                    L<em className="font-serif text-xl">s</em>
                  </p>
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form fixed to the bottom */}
      <div className="w-full border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about the transcript..."
            className="flex-grow px-4 text-sm text-gray-700 dark:text-gray-100 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            // Prevent auto zoom on iOS
            style={{
              fontSize: "16px", // Minimum 16px to prevent auto-zoom
              appearance: "none",
              borderRadius: "0",
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
            <span className="sr-only">Send message</span>
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear Chat History"
        message="Are you sure you want to clear all chat messages? This action cannot be undone."
        confirmButtonText="Clear"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default ChatInterface;

// "use client";

// import React, { useState, useRef, useEffect } from "react";
// //jotai
// import { useAtom } from "jotai";
// import { selectedTextAtom, chatMessagesAtom, ChatMessage } from "@/state/store";
// import { ENDPOINTS } from "@/lib/apiConfig";
// import SelectedText from "./SelectedText";
// import ConfirmModal from "./ConfirmModal";
// import type { Database } from "@/types/database.types";

// import { PaperAirplaneIcon, TrashIcon } from "@heroicons/react/24/outline";

// type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

// interface ChatInterfaceProps {
//   transcript: Transcript | null;
// }

// const ChatInterface = ({ transcript }: ChatInterfaceProps) => {
//   const [selectedText, setSelectedText] = useAtom(selectedTextAtom);
//   const [allMessages, setAllMessages] = useAtom(chatMessagesAtom);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // Filter messages for the current transcript only
//   const transcriptId = transcript?.id;
//   const messages = allMessages.filter(
//     (msg) => msg.transcriptId === transcriptId
//   );

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(scrollToBottom, [messages]);

//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (
//       !input.trim() ||
//       isLoading ||
//       !transcript?.id ||
//       !transcript?.transcript
//     )
//       return;

//     setIsLoading(true);

//     // Add selected text to the user's message if it exists
//     const userContent = selectedText ? `("${selectedText}") ${input}` : input;

//     // Create new message with transcript ID
//     const newMessage: ChatMessage = {
//       role: "user",
//       content: userContent,
//       transcriptId: transcript.id,
//     };

//     // Add to all messages
//     const updatedMessages = [...allMessages, newMessage];
//     setAllMessages(updatedMessages);
//     setInput("");

//     // Clear the selected text after using it
//     if (selectedText) setSelectedText("");

//     try {
//       const response = await fetch(ENDPOINTS.CHAT, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           transcript: transcript.transcript,
//           user_message: input,
//           selected_text: selectedText,
//         }),
//       });
//       const data = await response.json();

//       console.log("Server response:", data);

//       // Add assistant response with same transcript ID
//       const assistantMessage: ChatMessage = {
//         role: "assistant",
//         content: data.response,
//         transcriptId: transcript.id,
//       };

//       setAllMessages([...updatedMessages, assistantMessage]);
//     } catch (error) {
//       console.error("Error sending message:", error);
//       // Add error message with transcript ID
//       const errorMessage: ChatMessage = {
//         role: "assistant",
//         content: "Sorry, there was an error processing your request.",
//         transcriptId: transcript.id,
//       };

//       setAllMessages([...updatedMessages, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const clearChat = () => {
//     setIsConfirmModalOpen(true);
//   };

//   const handleConfirmClear = () => {
//     // Only remove messages for the current transcript
//     const otherMessages = allMessages.filter(
//       (msg) => msg.transcriptId !== transcript?.id
//     );
//     setAllMessages(otherMessages);
//     setIsConfirmModalOpen(false);
//   };

//   return (
//     <div className=" h-full flex flex-col justify-between">
//       <div className="z-10 relative mb-1 px-4 pt-2">
//         <div className="z-20">
//           <SelectedText />
//         </div>
//         <button
//           onClick={clearChat}
//           className="-z-10 absolute bg-white rounded-2xl py-1 px-2 dark:bg-slate-800 top-1 right-1 flex items-center text-gray-500 hover:text-red-500 text-sm font-medium focus:outline-none transition-colors duration-200"
//           title="Clear chat history"
//         >
//           <TrashIcon className="w-4 h-4 mr-1" />
//           Clear chat
//         </button>
//       </div>
//       {/* <div className="flex items-center justify-between mb-1 px-4 pt-2">
//         <div>
//           <SelectedText />
//         </div>
//         <button
//           onClick={clearChat}
//           className="flex items-center text-gray-500 hover:text-red-500 text-sm font-medium focus:outline-none transition-colors duration-200"
//           title="Clear chat history"
//         >
//           <TrashIcon className="w-4 h-4 mr-1" />
//           Clear chat
//         </button>
//       </div> */}

//       {/* Chat messages area */}
//       <div className="flex-grow overflow-y-auto p-4">
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`flex ${
//               msg.role === "user" ? "justify-end" : "justify-start"
//             } mb-4`}
//           >
//             <div
//               className={`flex items-start max-w-[70%] ${
//                 msg.role === "user" ? "flex-row-reverse" : "flex-row"
//               }`}
//             >
//               <div
//                 className={`p-4 w-10 h-10 rounded-full inline-flex items-center justify-center text-white ${
//                   msg.role === "user" ? "bg-rose-400 ml-2" : "bg-sky-600 mr-2"
//                 }`}
//               >
//                 {msg.role === "user" ? (
//                   "U"
//                 ) : (
//                   <p className="text-lg">
//                     L<em className="font-serif text-xl">s</em>
//                   </p>
//                 )}
//               </div>
//               <div
//                 className={`p-3 rounded-lg ${
//                   msg.role === "user"
//                     ? "bg-blue-100 text-blue-900"
//                     : "bg-gray-100 text-gray-900"
//                 }`}
//               >
//                 {msg.content}
//               </div>
//             </div>
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input form fixed to the bottom */}
//       <div className=" w-full border-t border-gray-200 p-4">
//         <form onSubmit={sendMessage} className="flex space-x-2">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Ask something about the transcript..."
//             className="flex-grow px-4 text-sm text-gray-700 dark:text-gray-100 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
//           />
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isLoading ? (
//               <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
//             ) : (
//               <PaperAirplaneIcon className="w-5 h-5" />
//             )}
//             <span className="sr-only">Send message</span>
//           </button>
//         </form>
//       </div>

//       <ConfirmModal
//         isOpen={isConfirmModalOpen}
//         onClose={() => setIsConfirmModalOpen(false)}
//         onConfirm={handleConfirmClear}
//         title="Clear Chat History"
//         message="Are you sure you want to clear all chat messages? This action cannot be undone."
//         confirmButtonText="Clear"
//         cancelButtonText="Cancel"
//       />
//     </div>
//   );
// };

// export default ChatInterface;
