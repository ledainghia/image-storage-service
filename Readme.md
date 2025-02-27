Dưới đây là **Hướng dẫn sử dụng chi tiết** để gọi các API của service trong đoạn code bạn cung cấp, được viết dưới dạng mã Markdown. Hướng dẫn bao gồm mô tả từng endpoint, phương thức HTTP, các tham số cần thiết, và ví dụ về cách gọi API.

---

# Hướng dẫn sử dụng API của Image Service

Service này cung cấp các API để quản lý, tải lên, chỉnh sửa và truy xuất thông tin về hình ảnh. Server chạy mặc định trên `http://localhost:3002`. Dưới đây là chi tiết từng endpoint.

## Cơ bản

- **Base URL**: `http://localhost:3002` (hoặc thay bằng domain/port bạn cấu hình).
- **Content-Type**: `application/json` (trừ khi upload file hoặc nhận hình ảnh).

---

## 1. Tải lên hình ảnh

### `POST /api/images`

Tải lên một hình ảnh và lưu trữ kèm metadata.

#### Tham số

- **Body**: Dữ liệu dạng `multipart/form-data`
  - `image` (file): File hình ảnh (chỉ hỗ trợ định dạng hình ảnh như `image/jpeg`, `image/png`,...).
- **Giới hạn**: Kích thước file tối đa 10MB.

#### Phản hồi

- **Thành công (201)**:
  ```json
  {
    "message": "Image uploaded successfully",
    "image": {
      "id": "unique-uuid",
      "originalName": "example.jpg",
      "path": "/images/unique-uuid.jpg",
      "size": 123456,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080,
      "createdAt": "2025-02-27T12:00:00Z"
    },
    "path": "/images/unique-uuid.jpg"
  }
  ```
- **Lỗi (400)**: Nếu không có file hoặc file không phải hình ảnh.
  ```json
  { "error": "No image file provided" }
  ```

#### Ví dụ

Sử dụng `curl`:

```bash
curl -X POST -F "image=@/path/to/example.jpg" http://localhost:3002/api/images
```

---

## 2. Lấy danh sách tất cả hình ảnh

### `GET /api/images`

Lấy thông tin metadata của tất cả hình ảnh đã tải lên.

#### Tham số

- Không có.

#### Phản hồi

- **Thành công (200)**:
  ```json
  [
    {
      "id": "unique-uuid",
      "originalName": "example.jpg",
      "path": "/images/unique-uuid.jpg",
      "size": 123456,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080,
      "createdAt": "2025-02-27T12:00:00Z"
    },
    ...
  ]
  ```

#### Ví dụ

```bash
curl http://localhost:3002/api/images
```

---

## 3. Lấy thông tin một hình ảnh theo ID

### `GET /api/images/:id`

Lấy metadata của một hình ảnh cụ thể dựa trên ID.

#### Tham số

- **Path**: `id` - ID của hình ảnh (chuỗi UUID).

#### Phản hồi

- **Thành công (200)**:
  ```json
  {
    "id": "unique-uuid",
    "originalName": "example.jpg",
    "path": "/images/unique-uuid.jpg",
    "size": 123456,
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "createdAt": "2025-02-27T12:00:00Z"
  }
  ```
- **Lỗi (404)**:
  ```json
  { "error": "Image not found" }
  ```

#### Ví dụ

```bash
curl http://localhost:3002/api/images/unique-uuid
```

---

## 4. Lấy hình ảnh đã resize

### `GET /api/resize/:id`

Lấy hình ảnh đã được resize theo kích thước yêu cầu.

#### Tham số

- **Path**: `id` - ID của hình ảnh.
- **Query**:
  - `width` (tùy chọn): Chiều rộng mong muốn (số nguyên).
  - `height` (tùy chọn): Chiều cao mong muốn (số nguyên).

#### Phản hồi

- **Thành công (200)**: Trả về dữ liệu nhị phân của hình ảnh (buffer) với `Content-Type` là `image/*` (tùy thuộc `mimeType`).
- **Lỗi (404)**:
  ```json
  { "error": "Image not found" }
  ```

#### Ví dụ

- Resize về chiều rộng 800px:

```bash
curl "http://localhost:3002/api/resize/unique-uuid?width=800" -o resized-image.jpg
```

- Resize về chiều rộng 800px và chiều cao 600px:

```bash
curl "http://localhost:3002/api/resize/unique-uuid?width=800&height=600" -o resized-image.jpg
```

---

## 5. Xóa hình ảnh

### `DELETE /api/images/:id`

Xóa một hình ảnh và metadata dựa trên ID.

#### Tham số

- **Path**: `id` - ID của hình ảnh.

#### Phản hồi

- **Thành công (200)**:
  ```json
  { "message": "Image deleted successfully" }
  ```
- **Lỗi (404)**:
  ```json
  { "error": "Image not found" }
  ```

#### Ví dụ

```bash
curl -X DELETE http://localhost:3002/api/images/unique-uuid
```

---

## 6. Cập nhật metadata của hình ảnh

### `PATCH /api/images/:id`

Cập nhật thông tin metadata (hiện chỉ hỗ trợ `originalName`).

#### Tham số

- **Path**: `id` - ID của hình ảnh.
- **Body**: JSON với các trường cần cập nhật.
  ```json
  {
    "originalName": "new-name.jpg"
  }
  ```

#### Phản hồi

- **Thành công (200)**:
  ```json
  {
    "id": "unique-uuid",
    "originalName": "new-name.jpg",
    "path": "/images/unique-uuid.jpg",
    "size": 123456,
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "createdAt": "2025-02-27T12:00:00Z"
  }
  ```
- **Lỗi (400)**: Nếu cập nhật trường không được phép.
  ```json
  { "error": "Invalid updates" }
  ```
- **Lỗi (404)**:
  ```json
  { "error": "Image not found" }
  ```

#### Ví dụ

```bash
curl -X PATCH -H "Content-Type: application/json" -d '{"originalName": "new-name.jpg"}' http://localhost:3002/api/images/unique-uuid
```

---

## 7. Lấy thống kê

### `GET /api/stats`

Lấy thông tin thống kê về tất cả hình ảnh.

#### Tham số

- Không có.

#### Phản hồi

- **Thành công (200)**:
  ```json
  {
    "totalImages": 5,
    "totalSize": 1234567,
    "formattedSize": "1.18 MB"
  }
  ```

#### Ví dụ

```bash
curl http://localhost:3002/api/stats
```

---

## Lưu ý

- **CORS**: API hỗ trợ CORS, cho phép gọi từ các domain khác.
- **File tĩnh**: Hình ảnh được phục vụ qua `/images/<filename>` (ví dụ: `http://localhost:3002/images/unique-uuid.jpg`).
- **Xử lý lỗi**: Luôn kiểm tra mã trạng thái HTTP và phản hồi JSON khi có lỗi.

Hy vọng hướng dẫn này giúp bạn dễ dàng sử dụng API của service! Nếu cần thêm thông tin, cứ hỏi nhé!
