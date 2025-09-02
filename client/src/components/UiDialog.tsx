import React, { useEffect, useRef } from 'react';

export interface UiDialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  rounded?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Optional aria ids to attach to the dialog */
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

/**
 * UiDialog
 * Reusable dialog wrapper styled with NES.css classes.
 * - Controls a native <dialog> element (showModal / close)
 * - Calls onClose when the dialog is dismissed (close or cancel)
 * - Renders a title slot and children content
 */
const UiDialog: React.FC<UiDialogProps> = ({ open, onClose, title, rounded = true, className = '', children, ariaLabelledBy, ariaDescribedBy }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;

    const handleClose = () => {
      onClose && onClose();
    };

    const handleCancel = (ev: Event) => {
      // prevent default to avoid leaving focus without explicit close handling if needed
      // allow dialog to close but forward the event
      onClose && onClose();
    };

    d.addEventListener('close', handleClose);
    d.addEventListener('cancel', handleCancel);

    if (open && !d.open) {
      try {
        d.showModal();
      } catch (e) {
        // fallback for browsers without dialog support: no-op
      }
    } else if (!open && d.open) {
      d.close();
    }

    return () => {
      d.removeEventListener('close', handleClose);
      d.removeEventListener('cancel', handleCancel);
      if (d.open) d.close();
    };
  }, [open, onClose]);

  const classes = `nes-dialog ${rounded ? 'is-rounded' : ''} ${className}`.trim();

  return (
    <dialog
      className={classes}
      ref={dialogRef}
      aria-hidden={!open}
      role="dialog"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <form method="dialog">
        {title && (
          ariaLabelledBy ? (
            <p id={ariaLabelledBy} className="title">
              {title}
            </p>
          ) : (
            <p className="title">{title}</p>
          )
        )}
        <div>{children}</div>
      </form>
    </dialog>
  );
};

export default UiDialog;
