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
  /** If false, prevent closing the dialog via Escape or clicking outside; user must explicitly close */
  dismissible?: boolean;
  /** Alignment for footer buttons inside `.dialog-menu` - defaults to 'right' */
  buttonAlignment?: 'right' | 'center';
}

/**
 * UiDialog
 * Reusable dialog wrapper styled with NES.css classes.
 * - Controls a native <dialog> element (showModal / close)
 * - Calls onClose when the dialog is dismissed (close or cancel)
 * - Renders a title slot and children content
 */
const UiDialog: React.FC<UiDialogProps> = ({
  open,
  onClose,
  title,
  rounded = true,
  className = '',
  children,
  ariaLabelledBy,
  ariaDescribedBy,
  dismissible = true,
  buttonAlignment = 'right',
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;

    const handleClose = () => {
      onClose && onClose();
    };

    const handleCancel = (ev: Event) => {
      if (!dismissible) {
        // prevent closing when dialog is marked non-dismissible
        try {
          ev.preventDefault();
        } catch (e) {}
        return;
      }
      // allow dialog to close and forward event
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

    // Align any footer/menu buttons inside the dialog to the configured alignment
    try {
      const menus = d.querySelectorAll('.dialog-menu');
      menus.forEach((m) => {
        const el = m as HTMLElement;
        el.style.display = 'flex';
        el.style.gap = '0.5rem';
        el.style.justifyContent =
          buttonAlignment === 'center' ? 'center' : 'flex-end';
        el.style.alignItems = 'center';
      });
    } catch (e) {
      // ignore
    }

    return () => {
      d.removeEventListener('close', handleClose);
      d.removeEventListener('cancel', handleCancel);
      if (d.open) d.close();
    };
  }, [open, onClose, dismissible, buttonAlignment]);

  const classes =
    `nes-dialog ${rounded ? 'is-rounded' : ''} ${className}`.trim();

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
        {title &&
          (ariaLabelledBy ? (
            <h4 id={ariaLabelledBy} className="font-retro text-sm mb-2">
              {title}
            </h4>
          ) : (
            <h4 className="font-retro text-sm mb-2">{title}</h4>
          ))}
        <div>{children}</div>
      </form>
    </dialog>
  );
};

export default UiDialog;
