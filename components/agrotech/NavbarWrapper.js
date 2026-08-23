'use client'

import { useState } from 'react'
import Navbar from './Navbar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function NavbarWrapper({ profile }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogoutRequest = () => setShowLogoutConfirm(true)

  const handleLogoutConfirm = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <>
      <Navbar profile={profile} onLogout={handleLogoutRequest} />

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Agrotech?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun ini. Semua data Anda tetap tersimpan dengan aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
