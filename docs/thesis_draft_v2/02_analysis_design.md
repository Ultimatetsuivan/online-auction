# Бүлэг 2. Системийн шинжилгээ ба загварчлал

## 2.1 Хэрэглэгчийн шаардлага

### 2.1.1 Системийг ашиглах хэрэглэгчид

Системд гурван үндсэн түвшний хэрэглэгч (actor) байна:

* **Админ** — Системийг бүхэлд нь удирдах эрхтэй, дотооддоо хэдхэн хүн.
* **Хэрэглэгч (бүртгэлтэй)** — Бараа худалдаалах, дуудлагад оролцох эрхтэй.
* **Зочин (бүртгэлгүй)** — Зөвхөн нийтийн мэдээллийг харах эрхтэй.

### 2.1.2 Системийн хэрэглэгчид дэлгэрэнгүй

Манай систем нь дараах гурван түвшний хэрэглэгчтэй:

* **Админ.** Энэ хэрэглэгч нь системийг удирдах, хэрэглэгчдийг удирдах, бараа удирдах зэрэг удирдлагын чанартай хамгийн дээд түвшний эрхтэй хэрэглэгч юм. Админ нь категорийг засварлах, дансыг цэнэглэх, иргэний баталгаажуулалтын хүсэлтүүдийг шалгах зэрэг үүргийг гүйцэтгэнэ. Системд `role: 'admin'` талбараар тодорхойлогддог.
* **Хэрэглэгч.** Энэхүү хэрэглэгч нь өөрийн худалдаалахыг хүссэн барааг дуудлага худалдаанд байршуулах, бусад хэрэглэгчийн барааг дуудлага худалдаанаас худалдан авах боломжтой системд бүртгэлтэй хэрэглэгч юм. Системийн дийлэнхи функцийг ашиглана. `role: 'buyer'` буюу default.
* **Зочин.** Энэхүү хэрэглэгч нь хэдийд ч, хаанаас ч дуудлага худалдаанд байгаа барааг харах танилцах болон системд бүртгүүлэх боломжтой системд бүртгэлгүй хэрэглэгч юм. Read-only mode.

## 2.2 Системийн функциональ шаардлага

### 2.2.1 Админы функциональ шаардлага

1. **Бараа зохицуулалт**
   * Бараа устгах
   * Бараа нэмэх
   * Барааны мэдээлэл засах
   * Бараа худалдах (force-sell)
2. **Хэрэглэгч удирдах**
   * Хайлт хийх (нэр, и-мэйл, утсаар)
   * Хэрэглэгчийн бараа үзэх
   * Хэрэглэгчийг түгжих/нээх
3. **Худалдаануудын мэдээллийг харах** — Бүх transaction-ийг dashboard-аар харах.
4. **Хэрэглэгчдийн дансыг цэнэглэх** — Дотоод балансыг тохируулах (QPay интеграц орохоос өмнө гар аргаар).
5. **Системд нэвтрэх** — Админы тусгай login.
6. **Ангилал удирдах**
   * Ангилал устгах
   * Ангилал нэмэх
   * Hierarchy зохиох (parent-child)
7. **Ирсэн хүсэлтүүдийг зохицуулах**
   * Хүсэлтийг зөвшөөрөх
   * Хүсэлтийг татгалзах

### 2.2.2 Хэрэглэгчийн функциональ шаардлага

1. **Бараа зохицуулалт**
   * Бараа устгах (зөвхөн өөрийнхөө бараа)
   * Бараа нэмэх (20 хүртэл зураг, AI category suggestion)
   * Барааны мэдээлэл засах
   * Бараа худалдах (дуудлага дуусахад автоматаар)
2. **Профайл удирдах** — Нэр, зураг, утас, и-мэйл, нууц үг солих.
3. **Системд нэвтрэх** — И-мэйл, Google OAuth, утасны баталгаажуулалт.
4. **Бараа хайх**
   * Энгийн хайлт (нэр, түлхүүр үг)
   * Шүүлтүүртэй (ангилал, үнэ, нөхцөл, байршил)
5. **Бараа үзэх** — Дэлгэрэнгүй мэдээлэл, зургийн галерэй, үнэлгээ.
6. **Данс цэнэглэх** — QPay болон админаар.
7. **Худалдан авалтын түүх харах** — Won/Lost auctions.
8. **Үнэ санал болгох** — Bid placement.
9. **Худалдан авалт хийх** — Buy Now.
10. **Watchlist** — Сонирхсон бараа ажиглах.
11. **Үнэлгээ өгөх** — Худалдагч, бараанд rating + comment.

### 2.2.3 Зочны функциональ шаардлага

1. Идэвхтэй дуудлага худалдаануудыг үзэх.
2. Бараа хайх (энгийн ба шүүлтүүртэй).
3. Бүртгэл үүсгэх.
4. Нэвтрэх.

## 2.3 Системийн функциональ бус шаардлага

### 2.3.1 Гүйцэтгэлийн шаардлага

1. **Хайлтын хурд** — Хуудас шилжих хугацаа 5 секундээс хэтрэхгүй байх. Бодит хэмжилт (Бүлэг 4-д): дунджаар 2-3 секунд.
2. **Ойлгомжтой UI** — Хэрэглэгч хараад ойлгомжтой байхаар хөгжүүлнэ. Дуудлага худалдаанд үнэ өгөх болон хугацааг харуулах хэсгийг real-time data ашиглана гүйцэтгэх.
3. **API хариу хугацаа** — 500 мс-ээс хэтрэхгүй (95-р перцентил).
4. **Серверийн ажиллагаа** — 24/7. Сервер унасан үед нөөц сервер лүү шилжих (MongoDB Atlas-ын autofailover).
5. **Бодит цагийн bid update** — < 1 сек оролцогч бүрт хүрэх.

### 2.3.2 Програм хангамжийн шинж чанарууд

1. **Хүртээмжтэй байдал** — Сервер унасан үед нөөц сервер лүү шилжих. MongoDB Atlas replicaset (3 node) ашиглана.
2. **Аюулгүй байдал**:
   * Нууц үгийг bcrypt-ээр шифрлэж хадгална.
   * JWT-г 7 өдрийн хугацаатай тогтоосон.
   * HTTPS заавал.
   * Rate limiting: IP бүрд минутанд 100 хүсэлт.
   * SQL/NoSQL injection-ээс хамгаалах (Mongoose schema validation).
3. **Хэмжээ** — MongoDB Atlas M10 tier эхлээд (10GB storage), 100,000+ хэрэглэгч хүртэл өргөтгөх боломжтой.
4. **Хадгалалт** — Файлын систем (Cloudinary CDN), өгөгдлийн сан (Atlas), backup нь өдөр бүр.
5. **Хадгалагдсан өгөгдлийн нөхөн сэргээх** — Atlas-ын point-in-time recovery, 7 хоногийн backup.

## 2.4 Системийн архитектур

Энэхүү систем нь 3 давхаргат (3-tier) full-stack архитектуртай бөгөөд дараах үндсэн бүрэлдэхүүн хэсгүүдээс бүрдэнэ. Энэхүү шийдвэр нь codebase-ийн засвар, тестлэх боломжийг сайжруулдаг classic separation-of-concerns зарчмыг даган ажиллана.

> **Зураг 2.1.** 3-tier архитектурын ерөнхий зураг (Chart/3 tier.png).

### 2.4.1 Client давхарга (Presentation Layer)

* **Веб клиент** — React.js + Vite ашиглан хөгжүүлсэн Single Page Application (SPA). Responsive дизайнтай, бүх төхөөрөмж дээр тохируулга хийх боломжтой.
* **Мобайл клиент** — React Native + Expo ашиглан хөгжүүлсэн cross-platform мобайл аппликейшн. iOS болон Android төхөөрөмж дээр native performance-тай ажиллана.
* **Харилцааны протокол** — RESTful API (HTTPS) болон WebSocket (Socket.IO) — бодит цагийн мэдээлэл солилцох.

Энэ давхарга нь бизнес логик агуулдаггүй; зөвхөн UI төлвөө удирдаж, backend-ээс орж ирсэн мэдээлэл харуулна.

### 2.4.2 Бизнес логикийн давхарга (Application Layer)

* **Backend API** — Node.js + Express.js framework дээр бүтээгдсэн RESTful API сервер.
* **Үндсэн функцүүд**:
  * Хэрэглэгчийн баталгаажуулалт (JWT, Google OAuth, Firebase Phone Auth)
  * Бараа удирдах (CRUD үйлдлүүд, зураг хадгалалт)
  * Дуудлага худалдааны логик (санал авах, дуудлага худалдааны статус шалгах)
  * Бодит цагийн мэдээлэл дамжуулалт (Socket.IO room broadcast)
  * Гүйлгээ болон төлбөрийн системийн интеграц
  * Cron job-ууд (дуудлага дуусгах, ялагч тогтоох)
* **Middleware**: Authentication, Authorization (role check), Error handling, Rate limiting, Logging, CORS, body parsing.

### 2.4.3 Өгөгдлийн давхарга (Data Layer)

* **Өгөгдлийн сан** — MongoDB (NoSQL), уян хатан схем, өргөтгөх боломжтой.
* **Өгөгдлийн модел**: User, Product, Bidding, Transaction, Category, Notification, Watchlist, Review, Report, Like, NotificationSettings.
* **Хадгалах систем**:
  * Өгөгдлийн сан — MongoDB Atlas (cloud).
  * Зураг — Cloudinary CDN.

### 2.4.4 Системийн харилцааны бүтэц

Бүх клиент (веб болон мобайл) нь нэгэн backend API руу хандаж мэдээлэл солилцдог. Энэ нь:

* Кодыг давхардуулахаас сэргийлнэ (DRY principle).
* Бизнес логикийг төвлөрсөн удирдлага хийнэ.
* Аюулгүй байдлыг төвлөрсөн хэрэгжүүлнэ.
* Өргөтгөх, засвар хийхэд хялбар болгоно.

Бодит цагийн функцүүд (дуудлага худалдааны мэдээлэл, мэдэгдэл) нь Socket.IO ашиглан WebSocket холболтоор дамждаг. Бусад үйлдлүүд нь REST API ашиглана.

### 2.4.5 Socket.IO event загвар

Socket.IO нь бодит цагийн харилцааг *room*-аар зохион байгуулдаг. Манай системд хэрэгжүүлсэн үндсэн event-үүд:

| Event | Чиглэл | Тайлбар |
|-------|--------|---------|
| `joinAuction(productId)` | Client → Server | Хэрэглэгч тухайн дуудлагын room-д орох |
| `leaveAuction(productId)` | Client → Server | Гарах |
| `placeBid({productId, amount})` | Client → Server | Шинэ үнэ санал |
| `bidUpdate({productId, currentBid, highestBidder, totalBids})` | Server → Room | Бүх оролцогчид шинэ үнэ зарлах |
| `auctionEnded({productId, winnerId, finalPrice})` | Server → Room | Дуудлага дуусгасан |
| `outbid({productId, newBid})` | Server → User | Тухайн хэрэглэгчийг гүйцсэн мэдэгдэл |
| `notification({type, message})` | Server → User | Push-маягийн мэдэгдэл |

## 2.5 Use Case текстэн тайлбар

UML use case диаграм нь зөвхөн харилцаа харуулдаг тул системийн гол хэрэглээний кейсүүдийг текстээр дэлгэрүүлж бичих нь шаардлагатай.

### Use Case 1: Бараа байршуулах

* **Actor**: Бүртгэлтэй хэрэглэгч
* **Preconditions**: Хэрэглэгч нэвтэрсэн, хүчинтэй JWT-тэй
* **Main flow**:
  1. Хэрэглэгч "Бараа нэмэх" товч дарна
  2. Гарчиг, тайлбар, ангилал, нөхцөл, зураг (1-20) оруулна
  3. AI ангилал санал болгож, хэрэглэгч хүлээн авна эсвэл өөрчилнө
  4. Үндсэн үнэ, минимум алхам, нөөц үнэ, Buy Now үнэ, хугацаа тохируулна
  5. "Хадгалах" дарна
  6. Систем зургийг Cloudinary дээр upload хийж, мэдээллийг MongoDB-д хадгална
  7. `auctionStatus = 'scheduled'` эсвэл `'active'` болно
* **Alternative flow A2**: Зураг 20-оос их → алдаа буцаах
* **Alternative flow A3**: Үнэ negative → алдаа буцаах
* **Postconditions**: Шинэ Product баримт үүсэх, watchlist subscriber-ст мэдэгдэл явах

### Use Case 2: Дуудлагад оролцох (place bid)

* **Actor**: Бүртгэлтэй хэрэглэгч
* **Preconditions**: Хэрэглэгч нэвтэрсэн, дансны үлдэгдэл хангалттай, бараа `active`
* **Main flow**:
  1. Хэрэглэгч бараа дээр очно
  2. `joinAuction` event илгээх (Socket.IO)
  3. Үнэ оруулах (currentBid + minIncrement дээр)
  4. "Үнэ санал болгох" дарна
  5. Server: `currentBid` > бодит шинэ үнэ → reject
  6. Server: balance шалгах
  7. `Bidding` баримт үүсгэх
  8. Product-ийн `currentBid`, `highestBidder` шинэчлэх
  9. Бүх оролцогчид `bidUpdate` event илгээх
  10. Өмнөх хамгийн өндөр санал өгсөн хүнд `outbid` event илгээх
* **Alternative flow A6**: Хангалтгүй balance → 400 + "Insufficient balance"

### Use Case 3: Дуудлага дуусах (system)

* **Actor**: Cron job (system)
* **Trigger**: `bidDeadline <= Date.now()` бүхий active auction
* **Main flow**:
  1. Cron job 1 минут тутамд хайна
  2. Дууссан auction олж `auctionStatus = 'ended'` болгоно
  3. Хамгийн өндөр санал өгсөн хэрэглэгчийг `soldTo` болгоно
  4. Buyer-ийн balance-аас үнийг хасна
  5. Seller-ийн balance-д үнийг нэмнэ (commission fee хасаад)
  6. `Transaction` баримт үүсгэнэ
  7. Winner-д `auctionEnded` + push notification
  8. Бусад оролцогчид `lost` notification
* **Alternative flow A2**: Reserve price хүрээгүй → unsold болгож, мэдэгдэл явуулах

### Use Case 4: Хэрэглэгч бүртгүүлэх

* **Actor**: Зочин
* **Main flow**:
  1. И-мэйл, нууц үг, нэр оруулах
  2. Server: и-мэйл давхар бус эсэхийг шалгах
  3. Password-ийг bcrypt-ээр хэшлэх
  4. User баримт үүсгэх
  5. И-мэйлд баталгаажуулах код илгээх
  6. Хэрэглэгч кодыг оруулна
  7. `emailVerified = true` болгох
  8. JWT буцаах, нэвтрүүлэх

### Use Case 5: Google OAuth-р нэвтрэх

* **Actor**: Зочин/Хэрэглэгч
* **Main flow**:
  1. "Google-р нэвтрэх" дарна
  2. Google identity flow → access token авах
  3. Server: token-ыг шалгаж, Google ID авах
  4. `googleId` бүхий User байгаа эсэхийг хайх
  5. Байхгүй бол шинээр үүсгэх
  6. JWT буцаах

### Use Case 6: Watchlist дээр нэмэх

* **Actor**: Бүртгэлтэй хэрэглэгч
* **Main flow**:
  1. Бараа дээр зүрхэн товч дарна
  2. `Watchlist` баримт үүсэх (unique: user + product)
  3. Notification preference тохируулах (notifyOnStart, notifyOnEndingSoon, notifyOnPriceChange)
  4. Auction-ы үйл явдлууд тохиолдох тутам энэ хэрэглэгчид мэдэгдэл явна

### Use Case 7: Үнэлгээ өгөх

* **Actor**: Худалдан авагч (deal дууссан)
* **Preconditions**: Transaction `completed` статустай
* **Main flow**:
  1. Хүлээж авсан барааны дэлгэцэнд "Үнэлгээ өгөх" товч
  2. Од (1-5) ба сэтгэгдэл оруулах
  3. Review баримт үүсэх
  4. Seller-ийн `trustScore` дахин тооцоолох

### Use Case 8: Дансны цэнэглэлт

* **Actor**: Хэрэглэгч
* **Main flow**:
  1. Profile → "Данс цэнэглэх"
  2. Дүн оруулна
  3. QPay invoice үүсгэх (phase 1: админ approval)
  4. Хэрэглэгч банкны аппликейшнаар QR уншиж төлбөр хийх
  5. QPay callback → balance шинэчлэх
  6. Transaction баримт үүсгэх

## 2.6 ERD (Entity Relation Diagram)

> **Зураг 2.2.** Өгөгдлийн хамаарлын диаграм (Diagrams/erd).

Системийн өгөгдлийн сан нь MongoDB ашигладаг бөгөөд 11 үндсэн collection-той (User, Product, Bidding, Category, Watchlist, Review, Transaction, Notification, Report, Like, NotificationSettings). Хамаарлуудыг тойм байдлаар авч үзвэл:

### 2.6.1 Үндсэн entity-ууд

* **User** — Бүх хэрэглэгчийн үндсэн entity. role нь admin/buyer гэсэн утга авна. Дансны үлдэгдэл (balance), trust score, FCM token зэрэг бүгд хадгалагдана.
* **Product** — Auction-д тавьсан бараа. Seller (user FK), category FK, currentBid, highestBidder FK гэх мэт талбартай. Машины тусгай талбарууд (VIN, make, model, year, fuelType) нэмж зориулагдсан.
* **Bidding** — Үнэ санал бүрийн түүх. Бид бараа бүрд нэг бүртгэлд хэд хэдэн bid үлдээдэг тул дараа нь үнийн график зурахад тохиромжтой.
* **Category** — Ангилалын мод. parent → Category өөртөө дамжих холбоо (self-reference). 66 ангилал хэр анхдагч мэдээллээр бэлдсэн.

### 2.6.2 Туслах entity-ууд

* **Watchlist** — User ↔ Product 1:N холбоо, notification сонголтуудыг агуулсан.
* **Review** — fromUser → toUser (худалдагч), product контекстээр rating+comment.
* **Transaction** — buyer, seller, product, amount.
* **Notification** — type enum (outbid, won, sold, expiring_soon г.м.), title, message.

### 2.6.3 Голл хамаарлууд

| From | To | Cardinality | Тайлбар |
|------|-----|-------------|---------|
| User | Product | 1:N (seller) | Нэг хэрэглэгч олон бараа байршуулна |
| User | Bidding | 1:N (bidder) | Хэрэглэгч олон bid өгнө |
| Product | Bidding | 1:N | Нэг бараа олон bid авна |
| Product | Watchlist | 1:N | Олон хэрэглэгч ажиглана |
| Category | Category | 1:N (parent) | Hierarchy |
| Category | Product | 1:N | |
| User | Transaction | 1:N (buyer) | |
| User | Transaction | 1:N (seller) | |

## 2.7 Класс диаграм

> **Зураг 2.3.** Зохиомжийн шатны класс диаграм (Diagrams/ClassDiagramm.jpg).

Класс диаграм нь backend дээрх Mongoose model-ууд болон тэдгээрийн service класс хоорондын харилцааг үзүүлдэг. Mongoose Schema → Model тогтоосон бөгөөд service давхрагад UserService, ProductService, BiddingService, TransactionService гэх мэт классууд ажилладаг.

Удирдлагын логик нь *Controller → Service → Model* гэсэн гурван давхаргат урсгалаар явна:

* **Controller** — HTTP request боловсруулах, validation, response.
* **Service** — Бизнес логик. Жнь BiddingService.placeBid() нь balance шалгах, currentBid validate, bid үүсгэх, Product шинэчлэх, Socket emit гэх мэтийг бүгдийг хийнэ.
* **Model** — Schema, validation, indexes.

## 2.8 Дарааллын диаграм (Sequence Diagrams)

> **Зураг 2.4.** Нэвтрэх дарааллын диаграм (Diagrams/login).

Хэрэглэгч и-мэйл/нууц үгээ оруулаад "Нэвтрэх" дарахад UI нь POST /api/users/login-ыг дуудна. Controller нь email-аар User олж, bcrypt.compare()-ээр нууц үгийг шалгана. Зөв бол JWT үүсгэж буцаана. Клиент token-ыг AsyncStorage/localStorage-д хадгална.

> **Зураг 2.5.** Дуудлага худалдаа үзэх дарааллын диаграм (Diagrams/baraauzeh).

Хэрэглэгч product detail хуудсыг ачаалахад GET /api/product/:id, GET /api/bidding/:productId, GET /api/reviews/product/:id гэх мэт хэд хэдэн endpoint зэрэг дуудагдана. Socket.IO дээр `joinAuction(productId)` event илгээгдэн нэвтэрсэний дараа bidUpdate event-ийг дагах болно.

> **Зураг 2.6.** Үнэ санал болгох дарааллын диаграм (Diagrams/Blank diagram).

`placeBid` event илгээгдэхэд server нь:
1. Token шалгана (JWT middleware).
2. Product status `active` эсэхийг шалгана.
3. currentBid + minIncrement-аас илүү гэдгийг шалгана.
4. Balance хангалттай эсэхийг шалгана.
5. Mongoose транзакц нээж: Bidding insert, Product update, balance hold.
6. Socket.IO room-руу `bidUpdate` broadcast.
7. Өмнөх highestBidder руу `outbid` emit + push notification.

## 2.9 Төлөвийн диаграм (State Diagrams)

> **Зураг 2.7.** Хайлт хийх төлөвийн диаграм (Diagrams/tolow).

Хайлтын төлөв: idle → typing → debounced → searching → results | error.

> **Зураг 2.8.** Худалдан авалт хийх төлөвийн диаграм (Diagrams/tolow1).

Худалдан авалтын төлөв: browsing → viewing → bidding → outbid|won|lost. Won → payment_pending → completed.

> **Зураг 2.9.** Бараа нэмэх төлөвийн диаграм (Diagrams/tolow2).

Бараа нэмэх төлөв: form_open → uploading_images → ai_suggesting → reviewing → saved (scheduled|active).

## 2.10 Үйл ажиллагааны диаграм (Activity Diagrams)

> **Зураг 2.10.** Бүртгүүлэх үйл ажиллагааны диаграм (Diagrams/uilajillagaa).
> **Зураг 2.11.** Бараа нэмэх үйл ажиллагааны диаграм (Diagrams/uilajillagaa2).

## 2.11 Өгөгдлийн загвар (Data Model) дэлгэрэнгүй

### 2.11.1 User collection

User collection нь системийн төв entity бөгөөд authentication-ийн бүх хувилбарыг (local, Google, phone, eMongolia) нэг баримтад нэгтгэдэг. Чухал талбарууд:

* `username, name, surname, registrationNumber` — Хэрэглэгчийн нэр, регистр.
* `email, password (bcrypt hash), phone, phoneVerified` — Identity.
* `role: 'admin' | 'buyer'`.
* `googleId, eMongoliaId, eMongoliaVerified` — Гадаад identity-ууд.
* `balance` — Дотоод данс (төгрөгөөр).
* `fcmTokens [String]` — Утасны push notification token-ууд.
* `trustScore` — 0-100 хооронд. `completedDeals * 5 - cancelledBids * 10`-аар тооцоолно.
* `identityVerification { status, documents, idDetails }` — eMongolia/КYC процессын статус.

Индексүүд: `email` (unique), `phone` (unique sparse), `googleId` (unique sparse).

### 2.11.2 Product collection

Product collection нь auction-д тавьсан барааг агуулна. Энэ нь хамгийн нийлмэл schema-тай:

* **Identity**: title, slug (URL-friendly), description (rich text/HTML).
* **Зураг**: images массив (Cloudinary URL + public_id, isPrimary флагтай). 20 хүртэл.
* **Үнийн загвар**: price (starting), currentBid, reservePrice, buyNowPrice, minIncrement, bidThreshold.
* **Барааны статус**: condition (new/used/refurbished/like-new), brand, color, size, dimensions.
* **Машины тусгай талбарууд**: vin, make, model, year, mileage, fuelType, transmission.
* **Auction lifecycle**: startMode (immediate|scheduled), auctionStart, auctionDuration, bidDeadline, auctionStatus (scheduled|active|ended).
* **Verification**: verified, verification { status, photos, reviewedBy, badgeType }.
* **Үр дүн**: sold, soldTo (FK), highestBidder (FK), views, uniqueViewers.

Индексүүд: `title` (text), `category`, `auctionStatus + bidDeadline` (compound), `user`.

### 2.11.3 Bidding collection

Bidding нь өчүүхэн жижиг schema-тай боловч хамгийн өндөр write-нагрузка авдаг. Талбарууд: user, product, price, timestamps. Индекс: `{ product: 1, price: -1, createdAt: -1 }` — энэ нь bid history-ийг үнээр буурах эрэмбээр шуурхай авах боломж олгоно.

### 2.11.4 Category collection

Hierarchical. parent → Category өөртөө дамжих. titleMn нь Монгол хэлний нэр, slug нь URL-friendly. icon талбарт Ionicons-ийн нэр (жнь `car-sport-outline`). 66 анхдагч ангилалаар бэлдсэн.

### 2.11.5 Notification collection

type enum: `like_update`, `outbid`, `won_auction`, `sold`, `price_drop`, `expiring_soon`, `new_bid`. `read: Boolean` талбараар уншсан/үгүйг тэмдэглэнэ.

## 2.12 API дизайны зарчим

* **RESTful** — Resource-based URL (/api/product, /api/users), HTTP method-ыг семантикаар ашиглах.
* **Versioning** — Одоогоор v1 implicit, цаашид /api/v2/... зам бэлдсэн.
* **Error format** — `{ error: 'message', code: 'ERR_CODE', details: {...} }`.
* **Status codes** — 200, 201, 400, 401, 403, 404, 409, 422, 429, 500.
* **Pagination** — `?page=1&limit=20`, response-д `total`, `page`, `hasMore`.
* **Filtering & sorting** — `?category=xxx&minPrice=10000&sort=-currentBid`.

## 2.13 Бүлгийн дүгнэлт

Энэ бүлэгт системийн актеруудыг тодорхойлж, функциональ ба функциональ бус шаардлагуудыг нарийвчилсан. 3-tier архитектурын үндэслэлийг тайлбарлаж, Socket.IO event загвар, REST API дизайны зарчмыг тогтоосон. UML дарааллын, төлөвийн, үйл ажиллагааны диаграмаар системийн динамик зан төлвийг харуулж, 11 collection-той MongoDB загварыг гаргасан. Энэ загвар нь Бүлэг 3-д хийгдэх хөгжүүлэлтийн тулгуур болж байна.
