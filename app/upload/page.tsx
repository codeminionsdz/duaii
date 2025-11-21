"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Camera, ImageIcon, ArrowRight, X, Plus, AlertCircle } from "lucide-react"
import Image from "next/image"
import { BackgroundPattern } from "@/components/ui/background-pattern"
import { uploadPrescription } from "@/app/actions/prescriptions"

export default function UploadPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal")
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length + selectedImages.length > 5) {
      toast({
        title: "خطأ",
        description: "يمكنك رفع 5 صور كحد أقصى",
        variant: "destructive",
      })
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: `حجم الصورة ${file.name} يجب أن يكون أقل من 5 ميجابايت`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    setSelectedImages((prev) => [...prev, ...validFiles])

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة الوصفة على الأقل",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      selectedImages.forEach((image) => {
        formData.append("images", image)
      })
      formData.append("notes", notes)
      formData.append("urgency", urgency)

      const result = await uploadPrescription(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "تم رفع الوصفة بنجاح",
        description: "سيتم إشعارك عندما ترد الصيدليات",
      })

      router.push("/home")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "خطأ في رفع الوصفة",
        description: error instanceof Error ? error.message : "حدث خطأ ما",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative min-h-screen pb-20 bg-gradient-to-b from-emerald-50/30 to-background">
      <BackgroundPattern />

      <div className="relative z-10">
        <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-7 w-7" />
            رفع وصفة طبية
          </h1>
          <p className="text-emerald-100 text-sm mt-1">ارفع صورة وصفتك وانتظر ردود الصيدليات</p>
        </header>

        <main className="p-4 space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>صور الوصفة</CardTitle>
              <CardDescription>التقط صور واضحة للوصفة الطبية أو اختر من المعرض (حتى 5 صور)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewUrls.length === 0 ? (
                <div className="space-y-3">
                  <label htmlFor="image-upload" className="block">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium mb-1">اضغط لاختيار صور</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG حتى 5MB لكل صورة</p>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <label htmlFor="camera-upload" className="cursor-pointer">
                        <Camera className="ml-2 h-5 w-5" />
                        التقاط صورة
                        <input
                          id="camera-upload"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <label htmlFor="gallery-upload" className="cursor-pointer">
                        <ImageIcon className="ml-2 h-5 w-5" />
                        من المعرض
                        <input
                          id="gallery-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border-2 border-emerald-500">
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`معاينة ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 left-1 h-7 w-7"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {selectedImages.length < 5 && (
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <label htmlFor="add-more" className="cursor-pointer">
                        <Plus className="ml-2 h-5 w-5" />
                        إضافة صور أخرى ({5 - selectedImages.length} متبقية)
                        <input
                          id="add-more"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  )}

                  <p className="text-sm text-emerald-600 text-center font-medium">
                    تم اختيار {selectedImages.length} صورة
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>مستوى الأولوية</CardTitle>
              <CardDescription>حدد مدى استعجالك للحصول على الأدوية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={urgency === "normal" ? "default" : "outline"}
                  className={urgency === "normal" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  onClick={() => setUrgency("normal")}
                >
                  عادي
                </Button>
                <Button
                  variant={urgency === "urgent" ? "default" : "outline"}
                  className={urgency === "urgent" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => setUrgency("urgent")}
                >
                  <AlertCircle className="ml-2 h-4 w-4" />
                  عاجل
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>ملاحظات إضافية</CardTitle>
              <CardDescription>أضف أي ملاحظات أو تفاصيل إضافية (اختياري)</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes" className="sr-only">
                الملاحظات
              </Label>
              <Textarea
                id="notes"
                placeholder="مثال: أحتاج الأدوية بشكل عاجل، أو لدي حساسية من دواء معين..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleUpload}
            disabled={selectedImages.length === 0 || isUploading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base"
          >
            {isUploading ? (
              "جاري الرفع..."
            ) : (
              <>
                رفع الوصفة
                <ArrowRight className="mr-2 h-5 w-5" />
              </>
            )}
          </Button>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
