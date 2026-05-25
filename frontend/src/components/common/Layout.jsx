import { Header, Footer } from "../../routes";
import { Chatbot } from "./Chatbot";

export const Layout = ({ children }) => {
    return (
    <div className="min-h-screen flex flex-col bg-bn-bg">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Chatbot />
    </div>
    );
};
