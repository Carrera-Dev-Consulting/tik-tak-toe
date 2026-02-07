import type { PropsWithChildren } from "react";

export interface ModalProps extends PropsWithChildren {
    title?: string;
    display?: boolean;
    onClose?: () => void;
}

export function Modal({ children, title, display, onClose }: ModalProps) {
    return <div className={display ? "fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center" : "hidden"}>
        <div className="w-1/2 bg-white text-black m-auto h-200 flex flex-col p-10">
            <div className="flex">
                {title && <h2 className="text-2xl font-bold">{title}</h2>}
                <span className="flex-1"></span>
                <span onClick={onClose} className="hover:cursor-pointer bg-red-500 rounded-full border p-1">X</span>
            </div>
            <div>
                {children}
            </div>
        </div>
    </div>
}