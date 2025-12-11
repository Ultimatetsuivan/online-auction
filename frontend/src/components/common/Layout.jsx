import { Header, Footer } from "../../routes";
import { Chatbot } from "./Chatbot";

export const Layout = ({ children }) => {
    return (
    <>
        <Header />
        <main>{children}</main>
        <Footer />
        <Chatbot />
    </>
    );
};