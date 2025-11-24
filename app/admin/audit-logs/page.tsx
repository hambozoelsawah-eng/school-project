"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  created_at: string;
  old_values: any;
  new_values: any;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Enrich with user names
      const enriched = await Promise.all(
        (data || []).map(async (log) => {
          const { data: userData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", log.user_id)
            .single();

          return {
            ...log,
            user_name: userData?.full_name || "Unknown",
          };
        })
      );

      setLogs(enriched);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) =>
    log.user_name.includes(searchTerm) ||
    log.action.includes(searchTerm) ||
    log.entity_type.includes(searchTerm)
  );

  const actionLabels: Record<string, string> = {
    created: "إنشاء",
    updated: "تحديث",
    deleted: "حذف",
    locked: "قفل",
    unlocked: "فتح",
  };

  const entityLabels: Record<string, string> = {
    grade: "درجة",
    student: "طالب",
    class: "فصل",
    teacher: "مدرس",
    profile: "ملف شخصي",
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            سجل التدقيق
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            تتبع جميع التعديلات والتغييرات في النظام
          </p>
        </div>

        <Input
          placeholder="ابحث في السجلات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading ? (
          <Card>
            <CardContent className="pt-6">جاري التحميل...</CardContent>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600 dark:text-slate-400">
              لا توجد سجلات
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">المستخدم</p>
                      <p className="font-semibold">{log.user_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">الإجراء</p>
                      <p className="font-semibold">
                        {actionLabels[log.action] || log.action}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">النوع</p>
                      <p className="font-semibold">
                        {entityLabels[log.entity_type] || log.entity_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">التاريخ والوقت</p>
                      <p className="font-semibold">
                        {new Date(log.created_at).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  </div>
                  {log.old_values || log.new_values ? (
                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                      <p className="font-semibold mb-2">التفاصيل:</p>
                      {log.old_values && (
                        <div className="mb-2">
                          <p className="text-red-600 dark:text-red-400">القيم السابقة:</p>
                          <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <p className="text-green-600 dark:text-green-400">القيم الجديدة:</p>
                          <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
