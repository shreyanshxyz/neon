use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView};

extern "C" {
  fn host_return_result(data_ptr: i32, data_len: i32, mime_type_ptr: i32) -> i32;
}

#[no_mangle]
pub extern "C" fn init() -> i32 {
  0
}

#[no_mangle]
pub extern "C" fn preview_file(data_ptr: i32, data_len: i32, _ext_ptr: i32, _ext_len: i32) -> i32 {
  let input = unsafe { slice_from_raw(data_ptr, data_len) };
  let decoded = match image::load_from_memory(input) {
    Ok(img) => img,
    Err(_) => {
      write_result(Vec::new(), "application/octet-stream");
      return 0;
    }
  };

  let resized = resize_to_thumbnail(decoded, 300, 300);
  let rgb = resized.to_rgb8();
  let mut output: Vec<u8> = Vec::new();
  let mut encoder = JpegEncoder::new_with_quality(&mut output, 85);
  let _ = encoder.encode(
    &rgb,
    rgb.width(),
    rgb.height(),
    image::ColorType::Rgb8.into(),
  );

  write_result(output, "image/jpeg");
  0
}

#[no_mangle]
pub extern "C" fn extract_metadata(data_ptr: i32, data_len: i32, _ext_ptr: i32, _ext_len: i32) -> i32 {
  let input = unsafe { slice_from_raw(data_ptr, data_len) };
  let decoded = match image::load_from_memory(input) {
    Ok(img) => img,
    Err(_) => {
      write_result(Vec::new(), "application/json");
      return 0;
    }
  };

  let metadata = format!(
    "{{\"width\":{},\"height\":{},\"format\":\"{}\"}}",
    decoded.width(),
    decoded.height(),
    format!("{:?}", decoded.color())
  );

  write_result(metadata.into_bytes(), "application/json");
  0
}

fn resize_to_thumbnail(image: DynamicImage, max_width: u32, max_height: u32) -> DynamicImage {
  let (width, height) = image.dimensions();
  if width <= max_width && height <= max_height {
    return image;
  }
  let ratio = (max_width as f32 / width as f32).min(max_height as f32 / height as f32);
  let new_width = (width as f32 * ratio).round().max(1.0) as u32;
  let new_height = (height as f32 * ratio).round().max(1.0) as u32;
  image.resize(new_width, new_height, FilterType::Lanczos3)
}

fn write_result(data: Vec<u8>, mime_type: &str) {
  let mime = mime_type.as_bytes().to_vec();
  let data_ptr = data.as_ptr() as i32;
  let data_len = data.len() as i32;
  let mime_ptr = mime.as_ptr() as i32;

  unsafe {
    host_return_result(data_ptr, data_len, mime_ptr);
  }
  
}

unsafe fn slice_from_raw<'a>(ptr: i32, len: i32) -> &'a [u8] {
  if ptr == 0 || len <= 0 {
    return &[];
  }
  std::slice::from_raw_parts(ptr as *const u8, len as usize)
}
