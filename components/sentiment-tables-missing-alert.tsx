"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download } from "lucide-react";
import Link from "next/link";

interface SentimentTablesMissingAlertProps {
  show: boolean;
  onClose?: () => void;
}

export function SentimentTablesMissingAlert({ show, onClose }: SentimentTablesMissingAlertProps) {
  if (!show) return null;

  return (
    <Alert className="border-yellow-200 bg-yellow-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">
        Chưa có dữ liệu Sentiment Keywords
      </AlertTitle>
      <AlertDescription className="text-yellow-700 mt-2">
        <div className="space-y-3">
          <p>
            Hệ thống AI phân tích sentiment chưa được khởi tạo. 
            Các đánh giá mới sẽ sử dụng từ khóa mặc định có sẵn, 
            nhưng để có trải nghiệm tốt nhất, bạn nên seed dữ liệu đầy đủ.
          </p>
          
          <div className="flex items-center gap-3">
            <Link href="/owner/seed-sentiment">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <Download className="h-4 w-4 mr-2" />
                Seed Sentiment Data
              </Button>
            </Link>
            
            {onClose && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Bỏ qua
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

