# Бүлэг 3. Системийн хөгжүүлэлт

Энэхүү бүлэгт онлайн дуудлага худалдааны бүрэн цогц системийн хөгжүүлэлтийн талаар дэлгэрэнгүй тайлбарлана. Систем нь 3 үндсэн бүрэлдэхүүн хэсгээс бүрдэнэ: (1) **Backend API** — серверийн логик, өгөгдлийн удирдлага; (2) **Веб аппликейшн** — React.js ашигласан хэрэглэгчийн веб интерфэйс; (3) **Мобайл аппликейшн** — React Native + Expo ашигласан iOS/Android апп. Бүх бүрэлдэхүүн хэсэг нь нэг төвлөрсөн backend API-той холбогдож ажилладаг.

Хөгжүүлэлтийг Agile зарчмаар, GitHub дээр feature branch ашиглан, daily commit-ын зарчмаар хийсэн. Total ~12,000 мөр код (backend ~4,500, frontend ~3,500, mobile ~4,000).

## 3.1 Хөгжүүлэлтийн орчин, технологийн сонголт

### 3.1.1 Backend технологийн сонголт

**Node.js** — Серверийн орчин болгон сонгосон гол шалтгаанууд:

* Асинхрон, хурдан (Google V8 engine).
* Нэг process-д олон холболт (Event Loop) — Socket.IO-той хослуулахад тохиромжтой.
* Real-time систем хөгжүүлэхэд тохиромжтой.
* Frontend-тэй ижил JavaScript хэл — codebase-ийн нэгдмэл байдал.

Бид LTS хувилбар (Node.js v20)-ыг сонгож хөгжүүлсэн бөгөөд `nodemon`-той development server, `pm2`-той production deployment-ыг бэлдсэн.

**Express.js** — RESTful API framework:

* REST API бүтээхэд хялбар (GET, POST, PUT, DELETE).
* Routes (URL хаяг) удирдах нь энгийн.
* Middleware экосистем (helmet, cors, express-rate-limit, morgan гэх мэт).

**REST API** дизайныг сонгосон шалтгаан:

* CRUD үйлдлүүд (Create, Read, Update, Delete) хийхэд тохиромжтой.
* JSON форматаар өгөгдөл дамжуулдаг (хялбар).
* OpenAPI/Swagger автоматаар үүсгэх боломжтой.
* Кэшлэх, CDN-аар нэмэхэд тохиромжтой.

**Database — MongoDB** (NoSQL):

* Уян хатан schema — бараа бүрд өөр өөр шинж чанартай мэдээлэл хадгалах боломжтой.
* Хэвтээ өргөтгөл (sharding).
* Mongoose ODM-аар schema validation.
* Aggregation pipeline-аар нийлмэл query (статистик, leaderboard).

**Бусад хэрэгслүүд**:

* **Cloudinary** — зураг хадгалалт, CDN, transformation.
* **GitHub** — frontend хөгжүүлэгчтэй хамтран ажиллахад.
* **Insomnia / Postman** — API тестлэх.
* **MongoDB Compass** — өгөгдлийн санг шууд харах.
* **Socket.IO** — bidirectional WebSocket communication.

### 3.1.2 Дев орчин

* OS: Windows 11 + WSL2 (Ubuntu 22.04).
* Editor: VS Code with ESLint, Prettier, Mongoose snippets.
* Git: GitHub repository, `main` + `develop` branch model.
* Node version manager: nvm.

## 3.2 Системийн модуль, бүрэлдэхүүн хэсгүүдийн тайлбар

Backend нь модуль бүрд тусдаа controller, route, service, model файл бүхий MVC-маягийн зохион байгуулалттай.

### 3.2.1 User Module

* `models/User.js` — Mongoose schema. bcrypt password hash, JWT token methods (`generateAuthToken`).
* `controllers/userController.js` — `register`, `login`, `forgotPassword`, `resetPassword`, `verifyEmail`, `addBalance`, `getProfile`, `updatePhoto`.
* `routes/userRoutes.js` — Express router тогтоосон.
* `services/emailService.js` — Nodemailer ашиглан SMTP-ээр и-мэйл илгээх.
* `services/googleAuthService.js` — Google OAuth verification.

### 3.2.2 Product Module

* `models/Product.js` — Барааны schema, олон тооны талбар, машины тусгай талбаруудыг агуулсан.
* `controllers/productController.js` — CRUD + `suggestCategory`, `myActiveAuctions`, `myEndedAuctions`.
* `services/cloudinaryService.js` — Зураг upload, transformation, delete.
* `services/categoryAiService.js` — Барааны title/description-аас тохирох ангилал санал болгох (keyword matching + similarity score).

### 3.2.3 Bidding Module

Үнэ санал болгох модуль — хэрэглэгчид бараанд үнэ санал болгох болон дуудлага худалдааны үнийн түүх харах боломжийг олгодог бөгөөд Express router болон MongoDB-ийн bidding collection ашиглан хөгжүүлсэн.

Үндсэн логик (псевдо код):

```javascript
async function placeBid(req, res) {
  const { productId, amount } = req.body;
  const userId = req.user.id;

  // 1. Product status шалгах
  const product = await Product.findById(productId);
  if (product.auctionStatus !== 'active') return error(400, 'Auction not active');

  // 2. Хугацаа шалгах
  if (Date.now() > product.bidDeadline) return error(400, 'Auction ended');

  // 3. Минимум алхам шалгах
  const minNext = product.currentBid + product.minIncrement;
  if (amount < minNext) return error(400, `Bid must be >= ${minNext}`);

  // 4. Balance шалгах
  const user = await User.findById(userId);
  if (user.balance < amount) return error(400, 'Insufficient balance');

  // 5. Transaction-ын дотор bid үүсгэх, product update
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const prevHighestBidder = product.highestBidder;
    const bid = await Bidding.create([{ user: userId, product: productId, price: amount }], { session });
    product.currentBid = amount;
    product.highestBidder = userId;
    await product.save({ session });
    await session.commitTransaction();

    // 6. Socket.IO broadcast
    io.to(`auction:${productId}`).emit('bidUpdate', {
      productId, currentBid: amount, highestBidder: userId, totalBids: await Bidding.countDocuments({ product: productId })
    });

    // 7. Outbid notification
    if (prevHighestBidder && prevHighestBidder.toString() !== userId) {
      io.to(`user:${prevHighestBidder}`).emit('outbid', { productId, newBid: amount });
      await Notification.create({ user: prevHighestBidder, type: 'outbid', message: '...' });
      sendFCM(prevHighestBidder, { title: 'Гүйцсэн!', body: '...' });
    }

    res.status(201).json({ bid });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
```

### 3.2.4 Шинэ дуудлага худалдаа үүсгэх модуль

Шинэ дуудлага худалдаа үүсгэх модуль нь хэрэглэгчид шинэ бараа нэмэх, барааны мэдээлэл өөрчлөх, устгах боломжийг олгодог бөгөөд Express router болон MongoDB-ийн product collection ашиглан хөгжүүлсэн.

Чухал онцлог: `startMode = 'scheduled'` бол `auctionStart` талбараар бараа тогтоосон хугацаанд автомат идэвхжинэ. `startMode = 'immediate'` бол нэмэгдсэн даруйд `active` болно. `bidDeadline = auctionStart + auctionDuration`.

### 3.2.5 Auction lifecycle cron job

`cron/auctionCloser.js` нь 1 минут тутамд ажиллаж:

* Scheduled auctions-аас `auctionStart <= now` ба `auctionStatus = 'scheduled'` бүгдийг `active` болгоно.
* Active auctions-аас `bidDeadline <= now` бүгдийг `ended` болгоно.
* `highestBidder` байгаа бол `soldTo`-г тогтоож, balance-ыг шилжүүлж, Transaction үүсгэнэ.
* Ялагч + ялагдагсадад мэдэгдэл явуулна.

### 3.2.6 Notification module

Notification нь хоёр channel-ээр явна:

1. **In-app** — `Notification` collection-д хадгалж, веб/мобайл апп уншина (`GET /api/notifications`).
2. **Push (мобайл)** — Firebase Cloud Messaging (FCM) ашиглан. Хэрэглэгчийн `fcmTokens` массив дахь бүх token руу илгээдэг.

Notification type enum: `like_update`, `outbid`, `won_auction`, `sold`, `price_drop`, `expiring_soon`, `new_bid`.

## 3.3 API болон өгөгдөл солилцоо

Манай системийн үндсэн API endpoint-ууд:

### 3.3.1 /api/users

* `/register` — Шинэ хэрэглэгч бүртгэх
* `/login` — Хэрэглэгч нэвтрэх
* `/logout` — Системээс гарах
* `/allusers` — Бүх хэрэглэгчийн жагсаалт (Админ)
* `/userbalance` — Хэрэглэгчийн дансны үлдэгдэл
* `/send-code` — Баталгаажуулах код илгээх
* `/verify-email` — Имэйл баталгаажуулах
* `/addBalance` — Данс цэнэглэх (Админ)
* `/forgot-password` — Нууц үг мартсан
* `/verify-reset-token/:token` — Token шалгах
* `/reset-password/:token` — Нууц үг шинэчлэх
* `/google` — Google OAuth нэвтрэх
* `/google/client-id` — Google Client ID авах
* `/photo` — Профайл зураг шинэчлэх

### 3.3.2 Бусад үндсэн endpoint бүлэг

* `/api/product` — Бараа удирдлага (GET-list, POST-create, GET-:id, PUT-:id, DELETE-:id, /my, /my/active, /suggest-category)
* `/api/bidding` — Дуудлага худалдааны санал (POST, GET-:productId, /my, /my-wins, /my-losses, /check-bid-status/:id)
* `/api/category` — Ангилал удирдлага
* `/api/transaction` — Гүйлгээний түүх
* `/api/request` — Хүсэлт удирдлага (identity verification, balance topup)
* `/api/likes` — Таалагдсан бараа
* `/api/watchlist` — Хянах жагсаалт
* `/api/notifications` — Мэдэгдэл систем (/unread-count, /:id/read)
* `/api/reviews` — Үнэлгээ, сэтгэгдэл (POST, GET-product/:id, GET-user/:id)
* `/api/admin` — Админ-only dashboard, статистик
* `/api/search` — Глобал хайлт (бүх бараа, ангилалаар filter)

Бүх API endpoint-үүд JSON формат ашиглан өгөгдөл солилцдог. Authentication шаардлагатай endpoint-үүд JWT token ашиглан хэрэглэгчийг таних үйлдлийг хийнэ. Token толгойд: `Authorization: Bearer <JWT>`.

### 3.3.3 API хариу формат

Амжилттай хариу:

```json
{
  "data": {...},
  "message": "Success"
}
```

Алдааны хариу:

```json
{
  "error": "Message",
  "code": "INSUFFICIENT_BALANCE",
  "details": {...}
}
```

Pagination response:

```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 247,
  "hasMore": true
}
```

## 3.4 Веб аппликейшны хөгжүүлэлт

### 3.4.1 Frontend веб технологийн сонголт

Веб аппликейшнд дараах технологиудыг ашигласан:

* **React.js** — Component-based архитектур, Virtual DOM-аар хурдан rendering, баялаг ecosystem, дахин ашиглах компонентууд.
* **Vite** — Маш хурдан build tool, Hot Module Replacement (HMR), хөгжүүлэлтийн орчин шуурхай ажиллана.
* **Tailwind CSS** — Utility-first CSS framework, responsive дизайн хийхэд хялбар, custom design system бүтээхэд тохиромжтой.
* **React Router** — Client-side routing, SPA, хуудас шилжих хурд өндөр.
* **Socket.io-client** — Бодит цагийн мэдээлэл, дуудлага худалдааны статус шууд харагдана.

### 3.4.2 Веб аппликейшны үндсэн функцууд

* Админы удирдлагын dashboard.
* Хэрэглэгчийн бүртгэл, нэвтрэх (Google OAuth, email).
* Бараа хайх, шүүлтүүр тавих.
* Дуудлага худалдаанд оролцох (бодит цагийн мэдээлэл).
* Барааны дэлгэрэнгүй мэдээлэл үзэх.
* Профайл удирдах, гүйлгээний түүх.
* Мэдэгдлийн систем.
* Responsive дизайн (бүх төхөөрөмж дээр).

### 3.4.3 Веб folder бүтэц

```
frontend/
├── src/
│   ├── components/        # ProductCard, BidForm, Navbar...
│   ├── pages/             # Home, ProductDetail, Profile, Admin...
│   ├── context/           # AuthContext, SocketContext
│   ├── hooks/             # useAuth, useSocket, useDebounce
│   ├── services/          # api.js (Axios wrapper)
│   ├── utils/             # formatters, validators
│   └── App.jsx
├── public/
└── vite.config.js
```

### 3.4.4 Socket.IO интеграц веб дээр

`SocketContext` нь app-аас глобал socket connection-ийг хэвээр барина. ProductDetail хуудас mount хийгдсэн үед `joinAuction(productId)` event илгээж, unmount үед `leaveAuction` ажиллана. `bidUpdate` event-д тулгуурлан `currentBid` state шинэчлэгдэж UI шууд update хийгддэг.

### 3.4.5 Админы dashboard

Админы dashboard-д дараах хэсэг багтсан:

* **Хэрэглэгчид** — Жагсаалт, хайлт, түгжих/нээх, баланс цэнэглэх.
* **Бараа** — Бүх бараа, force-delete, verification badge олгох.
* **Ангилал** — CRUD + hierarchy editor.
* **Хүсэлт** — Identity verification болон balance topup approval.
* **Статистик** — Хэрэглэгч/бараа/гүйлгээний хэмжүүр, Recharts ашиглан line/bar chart.

## 3.5 Мобайл аппликейшны хөгжүүлэлт

### 3.5.1 Мобайл технологийн сонголт

Мобайл аппликейшнд дараах технологиудыг ашигласан:

* **React Native** — Cross-platform (iOS, Android) хөгжүүлэлт нэг code base-ээр, JavaScript/TypeScript ашиглан, Native компонентуудтай ажиллах боломжтой, React.js-тэй адилхан архитектур (Component-based).
* **Expo** — React Native аппликейшнийг хөгжүүлэх, тест хийх хялбар орчин, Hot reload — Код солих бүрт шууд харагдах, олон built-in library (Camera, Location, Notification гэх мэт), iOS болон Android дээр тест хийхэд хялбар.
* **Expo Router** — File-based routing систем, TypeScript дэмжлэгтэй, Deep linking автоматаар дэмждэг.

### 3.5.2 Мобайл аппликейшны архитектур

Мобайл апп нь дараах үндсэн бүтэцтэй:

* **Tab Navigation** — Үндсэн навигаци (Home, Search, Selling, Notifications, Profile).
* **Stack Navigation** — Дэлгэрэнгүй хуудсууд (Product details, Category view, Add product).
* **Context API** — Global state management (AuthContext, LanguageContext, ThemeContext).
* **REST API Integration** — Backend-тэй холбогдох (Axios + interceptor token refresh).
* **Real-time Updates** — Socket.IO ашиглан бодит цагийн мэдээлэл.

### 3.5.3 Folder бүтэц (Expo Router)

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx            # Home
│   │   ├── search.tsx
│   │   ├── selling.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── product/[id].tsx
│   ├── category/[slug].tsx
│   ├── add-product.tsx
│   ├── login.tsx
│   └── _layout.tsx
├── components/
├── context/
├── services/
├── utils/
└── app.json
```

### 3.5.4 Мобайл аппликейшны үндсэн функцууд

#### Хэрэглэгчийн баталгаажуулалт

* Google OAuth нэвтрэх (Expo AuthSession).
* Утасны дугаараар баталгаажуулалт (Firebase Phone Auth).
* JWT token ашиглан session удирдлага.
* Автомат нэвтрэлт (AsyncStorage — нэвтэрсэн token нь хадгалагдаж дараагийн нээлтэд auto-login).

#### Бараа удирдах

* Бараа нэмэх (20 хүртэл зураг, expo-image-picker).
* AI категори санал болгох систем — title/description пораарж API дуудна.
* Rich text editor ашиглан дэлгэрэнгүй тайлбар.
* Автомашины тусгай мэдээлэл (VIN, Model, Year гэх мэт).
* Дуудлага худалдаа эхлэх огноо тохируулах (DateTimePicker).

#### Дуудлага худалдаа

* Бодит цагийн үнийн шинэчлэлт (Socket.IO).
* Countdown таймер (react-native-countdown).
* Үнийн түүхийн график (react-native-chart-kit).
* Өрсөлдөгчдийн мэдэгдэл (push + in-app).
* Watchlist функц (одтой нэмэх).

### 3.5.5 Мобайл дизайн загвар

Мобайл апп нь Mongolian marketplace-д зориулагдсан учир:

* Монгол, Англи хэлний дэмжлэг (i18next).
* Төгрөг валютын харуулалт (`₮` тэмдэг, мянгантын тусгаарлагч).
* Японы аукшин сайтуудын (Mercari, Yahoo Auctions) дизайн загвар — bottom tab navigation, нийлмэл filter screen, full-screen image gallery.
* Responsive дизайн (Phone, Tablet) — `useWindowDimensions`.
* Dark mode дэмжлэг (system theme follow).

### 3.5.6 Performance optimization

* `FlatList` (бус `ScrollView`) бараа жагсаалтад — virtualization-аар RAM хэмнэх.
* Зургийг `expo-image` (cache + placeholder) ашиглах.
* React.memo, useMemo, useCallback ашиглан re-render багасгах.
* Code splitting (lazy import) — Profile, Admin хуудсыг анх ачаалал бүрд багтаахгүй.
* Network retry + exponential backoff axios-interceptor дотор.

## 3.6 Аюулгүй байдал ба нэвтрэлт

Манай системд хэрэглэгч нэвтрэхдээ Админ болон хэрэглэгч гэж 2 түвшинд хуваагддаг.

* **Энгийн хэрэглэгч** — Дуудлагад оролцох, бараа байршуулах эрхтэй.
* **Админ хэрэглэгч** — Системийн бүх үйл ажиллагааг удирдах эрхтэй.

### 3.6.1 Ашиглах технологи

* **Express.js middleware** — Хандалтыг шалгах. `authMiddleware`, `adminMiddleware`.
* **JWT токен** — Хэрэглэгчийн session удирдах. `jsonwebtoken` npm package.
* **bcrypt** — Нууц үгийн шифрлэлт (10 round salt).
* **MongoDB** — Хэрэглэгчийн мэдээллийг хадгалах.
* **helmet** — HTTP security headers (XSS, clickjacking).
* **express-rate-limit** — DDoS урьдчилан сэргийлэх.
* **cors** — Cross-origin policy.

### 3.6.2 Ажиллах процесс

1. Хэрэглэгч нэвтрэхдээ токен үүсгэгдэнэ (JWT, expire 7 days).
2. Хүсэлт бүрд токеныг шалгана (`authMiddleware` Authorization header-аас уншиж `jwt.verify`).
3. Токен хүчингүй бол хандалтыг хязгаарлана (401).
4. Админ route-ууд дээр `adminMiddleware` нэмэгдэж role шалгана.

### 3.6.3 Алдааны тохиолдолд

* Токен байхгүй — `401 Unauthorized`.
* Админ эрхгүй — `403 Forbidden`.
* Буруу токен — `401 Unauthorized`.
* Истэк хугацаатай токен — `401` + `code: 'TOKEN_EXPIRED'`.

### 3.6.4 Өгөгдлийн хадгалалт ба нууцлал

Манай систем нь өгөгдлүүдээ MongoDB дээр хадгалдаг ба зураг файлыг Cloudinary-д байршуулдаг. Нууц үг гэх мэт эмзэг өгөгдлийг bcrypt ашиглаж шифрлэлт хийж хадгалдаг.

* **Bcrypt** — One-way hash, 10 rounds salt. Reverse boomgvi.
* **Sensitive fields**: `password`, `resetPasswordToken`, `eMongoliaId` — schema-д `select: false` тогтоосон.
* **Environment variables**: `JWT_SECRET`, `MONGO_URI`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_SECRET`, `FCM_SERVER_KEY` гэх мэт нь `.env` дотор хадгалагдаж repo-д commit хийгдээгүй.

### 3.6.5 Аюулгүй байдлын нэмэлт хэрэгсэл

* **Input validation** — express-validator схемээр шаардагдах талбарын төрөл, урт, формат шалгана.
* **NoSQL injection prevention** — Mongoose schema strict mode, `$where` оператор хориглосон.
* **XSS prevention** — Frontend дээр React-ийн default escape, mobile WebView хязгаарлагдмал.
* **CSRF** — JWT нь cookie бус Authorization header дээр явдаг тул CSRF-д өртөмтгий бус.

## 3.7 Гадны интеграцууд

### 3.7.1 Google OAuth 2.0

* Phase 1: Frontend дээр Google Identity Services button.
* Phase 2: Frontend нь id_token авах, server руу POST.
* Phase 3: Server `google-auth-library` ашиглан token-ыг verify, payload-аас sub (Google ID), email, name авах.
* Phase 4: googleId-аар User хайх, олдвол login, олдохгүй бол шинээр үүсгэх (auto-register).

### 3.7.2 Firebase Phone Auth

* Phase 1: Mobile дээр Firebase SDK, утсаар SMS OTP илгээх.
* Phase 2: Хэрэглэгч OTP оруулна, Firebase verify хийнэ, idToken буцаана.
* Phase 3: idToken-ыг backend руу илгээж, `firebase-admin` SDK verify.
* Phase 4: phone (E.164 format)-аар User хайх/үүсгэх, JWT буцаах.

### 3.7.3 Cloudinary

* Multer + multer-storage-cloudinary ашиглан upload route дээр шууд Cloudinary руу stream.
* `transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]` — оригинал хэмжээг автоматаар багасгах.
* Зургийн `public_id`-г хадгалж, бараа устгахад API-аар Cloudinary-аас устгана.

### 3.7.4 QPay (төлөвлөгөөтэй интеграц)

QPay-ийн merchant API-аар:

* `POST /v2/invoice` — Invoice үүсгэх, qr_image, qr_text, urls.deeplinks-тэй хариу авах.
* Хэрэглэгч банкны аппликейшнаар QR уншиж төлбөр.
* Callback URL дээр payment_status шалгах.
* Хэрэглэгчийн balance-ыг шинэчлэх, Transaction үүсгэх.

### 3.7.5 eMongolia (төлөвлөгөөтэй интеграц)

eMongolia API-аар иргэний баталгаажуулалт:

* Хэрэглэгч eMongolia аккаунтаараа login.
* Server back-чанал-аар иргэний нэр, регистр, төрсөн он баталгаажуулна.
* `eMongoliaVerified = true` болгож, "Баталгаажсан хэрэглэгч" badge өгнө.

## 3.8 Deployment ба DevOps

* **Backend deployment**: Render.com (Free/Hobby tier) — Auto-deploy from GitHub `main` branch.
* **Database**: MongoDB Atlas M0 (free) шилжих M10 при scale.
* **Frontend (web) deployment**: Vercel — `vite build`, static hosting + CDN.
* **Mobile**: Expo EAS Build — iOS .ipa, Android .apk/.aab. App Store + Play Store-д ачаалах төлөвлөгөөтэй.
* **Logs**: Winston + log rotation, production-д Sentry интеграц (error tracking).
* **Monitoring**: Atlas built-in monitoring + UptimeRobot ping.

## 3.9 Бүлгийн дүгнэлт

Энэ бүлэгт системийн гурван үндсэн бүрэлдэхүүний — backend API, веб клиент, мобайл клиент — хөгжүүлэлтийн нарийвчилсан тайлбарыг өгсөн. Технологийн сонголтын үндэслэл, модулиудын дотоод бүтэц, чухал бизнес логикийн псевдо код, REST endpoint-ын зохион байгуулалт, Socket.IO event-үүд, аюулгүй байдлын механизм, гадны үйлчилгээтэй интеграц зэргийг бүгдийг тусгасан. Дараа Бүлэг 4-д энэ хэрэгжүүлэлтийг хэрхэн тестлэж шалгасан үр дүнг танилцуулна.
