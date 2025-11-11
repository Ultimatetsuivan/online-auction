import { useState } from 'react'
import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home, Layout, Login, Product, Register, Profile, Admin, Details, ForgotPassword, ResetPassword, About, EditProduct, Categories, Brands, MyList } from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './styles/themes.css';


function App() {
  return (
    <>
     <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <ErrorBoundary>
            <Routes>
       <Route path="/" element={
        <Layout>
          <Home />
        </Layout>
        }/>
         <Route path="/register" element={
        <Layout>
          <Register />
        </Layout>
        }/>
        <Route path="/login" element={
        <Layout>
          <Login />
        </Layout>
        }/>
        <Route path="/allproduct" element={
        <Layout>
          <Product />
        </Layout>
        }/>
        <Route path="/profile" element={
        <Layout>
          <Profile />
        </Layout>
        }/>
        <Route path="/admin" element={
        <Layout>
          <Admin />
        </Layout>
        }/>
        <Route path="/products/:id" element={
          <Layout>
          <Details
           />
           </Layout>} />
           <Route path="/forgot-password" element={
          <Layout>
          <ForgotPassword
           />
           </Layout>} />
           <Route path="/reset-password/:token" element={
          <Layout>
          <ResetPassword
           />
           </Layout>} />
           <Route path="/about" element={
          <Layout>
          <About
           />
           </Layout>} />
           <Route path="/categories" element={
          <Layout>
          <Categories
           />
           </Layout>} />
           <Route path="/brands" element={
          <Layout>
          <Brands
           />
           </Layout>} />
           <Route path="/mylist" element={
          <Layout>
          <MyList
           />
           </Layout>} />
           <Route path="/edit-product/:id" element={
          <Layout>
          <EditProduct
           />
           </Layout>} />

            </Routes>
            </ErrorBoundary>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
     </BrowserRouter>
    </>
  )
}

export default App
