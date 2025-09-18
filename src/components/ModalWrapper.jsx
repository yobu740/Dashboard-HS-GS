
import React from 'react'
import ReactModal from 'react-modal'
import '../styles/modal.css'

/**
 * ModalWrapper - a tiny wrapper around react-modal that applies
 * responsive defaults and inner scrolling for mobile.
 *
 * Props:
 * - isOpen: boolean
 * - onRequestClose: () => void
 * - shouldCloseOnOverlayClick?: boolean (default true)
 * - contentClassName?: string (extra classes for content size variants, e.g. 'modal--lg')
 * - overlayClassName?: string (override overlay class)
 * - children: React.ReactNode
 * - ariaHideApp?: boolean (default false here; set true and call ReactModal.setAppElement in your app root if needed)
 */
const ModalWrapper = ({
  isOpen,
  onRequestClose,
  shouldCloseOnOverlayClick = true,
  contentClassName = '',
  overlayClassName = '',
  ariaHideApp = false,
  children
}) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      className={`gs-Modal__Content ${contentClassName}`}
      overlayClassName={overlayClassName ? overlayClassName : 'gs-Modal__Overlay'}
      ariaHideApp={ariaHideApp}
    >
      {children}
    </ReactModal>
  )
}

export default ModalWrapper
