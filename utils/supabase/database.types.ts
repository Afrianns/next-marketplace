export type ListingRow = {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  seller_name: string;
  seller_email: string;
  seller_address: string;
  seller_phone: string;
  description: string;
  image_path: string;
  created_at: string;
};

export type ListingInsert = Omit<ListingRow, "created_at"> & {
  created_at?: string;
};

export type ListingInquiryRow = {
  id: string;
  listing_id: string;
  buyer_email: string;
  message: string;
  created_at: string;
};

export type ListingInquiryInsert = Omit<
  ListingInquiryRow,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: ListingRow;
        Insert: ListingInsert;
        Update: Partial<ListingInsert>;
        Relationships: [];
      };
      listing_inquiries: {
        Row: ListingInquiryRow;
        Insert: ListingInquiryInsert;
        Update: Partial<ListingInquiryInsert>;
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
