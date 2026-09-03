import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Downloads() {
  const documents = [
    {
      title: "Documentación Técnica (Español)",
      description: "Documento Word completo con toda la información técnica del sistema Agrivo en español.",
      filename: "AGRIVO_Documentacion_ES.docx",
      format: "DOCX",
      size: "46 KB",
    },
    {
      title: "Technical Documentation (English)",
      description: "Complete Word document with all Agrivo system technical information in English.",
      filename: "AGRIVO_Documentation_EN.docx",
      format: "DOCX",
      size: "43 KB",
    },
    {
      title: "Documentación Markdown (Español)",
      description: "Versión en formato Markdown de la documentación técnica en español.",
      filename: "AGRIVO_DOCUMENTATION_ES.md",
      format: "MD",
      size: "28 KB",
    },
    {
      title: "Documentation Markdown (English)",
      description: "Markdown version of the technical documentation in English.",
      filename: "AGRIVO_DOCUMENTATION_EN.md",
      format: "MD",
      size: "27 KB",
    },
  ];

  const handleDownload = (filename: string) => {
    const link = document.createElement("a");
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-green-900 mb-3">
            📄 Documentación Técnica Agrivo
          </h1>
          <p className="text-gray-600 text-lg">
            Descarga la documentación completa para replicar el sistema
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.filename} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-green-600" />
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {doc.format} • {doc.size}
                  </span>
                  <Button
                    onClick={() => handleDownload(doc.filename)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}