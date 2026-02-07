use syntect::html::{css_for_theme_with_class_style, ClassStyle, ClassedHTMLGenerator};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;
use syntect::highlighting::ThemeSet;

extern "C" {
  fn host_return_result(data_ptr: i32, data_len: i32, mime_type_ptr: i32) -> i32;
}

#[no_mangle]
pub extern "C" fn init() -> i32 {
  0
}

#[no_mangle]
pub extern "C" fn highlight_code(data_ptr: i32, data_len: i32, lang_ptr: i32, lang_len: i32) -> i32 {
  let input = unsafe { slice_from_raw(data_ptr, data_len) };
  let code = String::from_utf8_lossy(input);
  let extension = unsafe { read_string(lang_ptr, lang_len) };

  let syntax_set = SyntaxSet::load_defaults_newlines();
  let theme_set = ThemeSet::load_defaults();
  let theme = theme_set.themes.get("base16-ocean.dark").unwrap_or_else(|| {
    theme_set.themes.values().next().unwrap()
  });

  let syntax = syntax_for_extension(&syntax_set, &extension);

  let mut generator = ClassedHTMLGenerator::new_with_class_style(syntax, &syntax_set, ClassStyle::Spaced);
  for line in LinesWithEndings::from(&code) {
    let _ = generator.parse_html_for_line_which_includes_newline(line);
  }
  let html_body = generator.finalize();

  let css = css_for_theme_with_class_style(theme, ClassStyle::Spaced).unwrap_or_default();
  let html = format!(
    "<style>{}</style><pre class=\"neon-code syntect\">{}</pre>",
    css, html_body
  );

  write_result(html.into_bytes(), "text/html");
  0
}

#[no_mangle]
pub extern "C" fn preview_file(data_ptr: i32, data_len: i32, lang_ptr: i32, lang_len: i32) -> i32 {
  highlight_code(data_ptr, data_len, lang_ptr, lang_len)
}

fn syntax_for_extension<'a>(set: &'a SyntaxSet, extension: &str) -> &'a syntect::parsing::SyntaxReference {
  if !extension.is_empty() {
    if let Some(syntax) = set.find_syntax_by_extension(extension.trim_matches('.')) {
      return syntax;
    }
  }
  set.find_syntax_plain_text()
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

unsafe fn read_string(ptr: i32, len: i32) -> String {
  if ptr == 0 || len <= 0 {
    return String::new();
  }
  let bytes = std::slice::from_raw_parts(ptr as *const u8, len as usize);
  String::from_utf8_lossy(bytes).to_string()
}
