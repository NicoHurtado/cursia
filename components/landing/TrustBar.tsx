export function TrustBar() {
  const companies = [
    { name: 'Notion', logo: 'N' },
    { name: 'Salesforce', logo: 'S' },
    { name: 'Harvard', logo: 'H' },
    { name: 'HubSpot', logo: 'H' },
    { name: 'McKinsey', logo: 'M' },
  ];

  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground/60">
            Confiado por equipos de las mejores empresas
          </p>
        </div>

        <div className="flex items-center justify-center space-x-12 opacity-60">
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-sm font-semibold">
                {company.logo}
              </div>
              <span className="text-sm font-medium">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
