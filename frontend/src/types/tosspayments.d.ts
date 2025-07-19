// frontend/src/types/tosspayments.d.ts

// 전역 window 객체에 PaymentWidget 속성이 존재함을 TypeScript에 알림
declare global {
    interface Window {
        PaymentWidget: (clientKey: string, customerKey: string) => any;
    }
}

// PaymentWidget 인스턴스가 가지는 메소드의 타입을 정의
interface PaymentWidgetInstance {
    renderPaymentMethods: (selector: string, amount: number) => void;
    requestPayment: (paymentInfo: {
        method: string;
        amount: number;
        orderId: string;
        orderName: string;
        customerName: string;
        successUrl: string;
        failUrl: string;
    }) => void;
}