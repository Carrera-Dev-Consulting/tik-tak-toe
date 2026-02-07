import type { PropsWithChildren } from "react";

// For future use..
export interface BasePageProps extends PropsWithChildren { }

const TOP_LINKS = [
    {
        name: "Home",
        href: "/"
    }
]

export default function BasePage({ children }: BasePageProps) {
    return <>
        <header className="flex flex-row gap-5 p-5 justify-center items-center">
            <h1 className="text-2xl">
                Tik Tak Toe
            </h1>
            <nav className="flex-1">
                <ul className="flex flex-row gap-1">
                    {
                        TOP_LINKS.map((link) => {
                            return <li key={link.href} className="underline border p-2 rounded-md hover:bg-white hover:text-black">
                                <a href={link.href}>{link.name}</a>
                            </li>
                        })
                    }
                </ul>
            </nav>
        </header>
        <main className="flex flex-col p-5  bg-white text-black h-[calc(100vh-150px)] overflow-auto">
            {children}
        </main>
        <footer className="p-5">
            © Copyright 2026 Andres Carrera
        </footer>
    </>
}