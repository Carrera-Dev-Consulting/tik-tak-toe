import { Link } from "react-router";
import BasePage from "./base";



export default function Home() {
    const links = [
        {
            name: "Local Play",
            href: "/play/local"
        },
        {
            name: "New Lobby",
            href: "/play/lobby"
        },
        {
            name: "Join Lobby",
            href: "/play/lobby/join"
        }

    ]
    return <BasePage>
        <h2 className="w-fit mx-auto my-5">Tik Tak Toe Lets Go!!!</h2>
        <p className="w-1/2 mx-auto">Welcome to Tik Tak Toe, If you want to play a browser session please click <span className="font-bold">Local Play</span> otherwise create a session with <span className="font-bold">New Lobby</span> or join a friend with <span className="font-bold">Join Lobby</span></p>
        <div className="w-1/2 mx-auto flex flex-col gap-5 mt-5">
            {
                links.map((link) => {
                    return <Link to={link.href} className="border p-5 text-center hover:bg-gray-400" key={link.href}>
                        {link.name}
                    </Link>
                })
            }
        </div>
    </BasePage >
}