import React, { useEffect, useRef } from 'react';

const TinyMCEEditor = ({ id = 'tinymce-editor', value = '', onChange, height = 400 }) => {
  const editorRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.tinymce && !initialized.current) {
      initialized.current = true;

      window.tinymce.init({
        selector: `#${id}`,
        height: height,
        menubar: false,
        plugins: [
          'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists',
          'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
          'checklist', 'code', 'fullscreen', 'help', 'image', 'insertdatetime',
          'preview', 'save', 'searchreplace'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
          'link image media table | align lineheight | checklist numlist bullist indent outdent | ' +
          'emoticons charmap | removeformat | code fullscreen preview',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }',
        setup: (editor) => {
          editorRef.current = editor;

          editor.on('change keyup', () => {
            const content = editor.getContent();
            if (onChange) {
              onChange(content);
            }
          });
        },
        init_instance_callback: (editor) => {
          if (value) {
            editor.setContent(value);
          }
        }
      });
    }

    // Cleanup
    return () => {
      if (editorRef.current) {
        try {
          window.tinymce.remove(`#${id}`);
          initialized.current = false;
        } catch (e) {
          console.error('TinyMCE cleanup error:', e);
        }
      }
    };
  }, [id, height]);

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || '');
    }
  }, [value]);

  return (
    <div>
      <textarea id={id} defaultValue={value} />
    </div>
  );
};

export default TinyMCEEditor;
