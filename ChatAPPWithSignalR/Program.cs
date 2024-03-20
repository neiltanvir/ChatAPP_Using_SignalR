using ChatAPPWithSignalR;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddRazorPages();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        builder =>
        {
            builder.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .WithMethods("GET", "POST")
                .AllowCredentials();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();
app.UseCors();
app.MapHub<ChatHub>("/chatHub");
app.MapPost("/upload", async context =>
{
    var formFile = context.Request.Form.Files[0];
    if (formFile != null && formFile.Length > 0)
    {
        var fileName = formFile.FileName;
        using var memoryStream = new MemoryStream();
        await formFile.CopyToAsync(memoryStream);
        var fileData = Convert.ToBase64String(memoryStream.ToArray());
        var chatHub = context.RequestServices.GetRequiredService<IHubContext<ChatHub>>();
        var user = context.Request.Form["user"];
        await chatHub.Clients.All.SendAsync("ReceivedFile", user, fileName, fileData);
    }
});

app.Run();
